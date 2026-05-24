from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Dict
import json
import logging
from datetime import datetime, timezone

from ..database import get_db

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
from ..models import Message, User
from ..schemas import MessageOut, MessageCreate, ConversationOut, MessageUnreadCount
from ..auth import SECRET_KEY, ALGORITHM, get_current_user
from ..utils.notifications import create_notification, display_name
from jose import jwt, JWTError

router = APIRouter(prefix="/messages", tags=["messages"])

class ConnectionManager:
    def __init__(self):
        # Maps user_id to a list of active WebSocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        logger.info(f"User {user_id} connected via WebSocket")
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_connections:
            logger.info(f"User {user_id} disconnected from WebSocket")
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            logger.info(f"Sending message to user {user_id} (active connections: {len(self.active_connections[user_id])})")
            for connection in self.active_connections[user_id]:
                await connection.send_text(message)
        else:
            logger.info(f"User {user_id} is not connected, skipping delivery")

manager = ConnectionManager()


def _visible_message_filter(current_user_id: int):
    return or_(
        and_(Message.sender_id == current_user_id, Message.sender_deleted_at.is_(None)),
        and_(Message.receiver_id == current_user_id, Message.receiver_deleted_at.is_(None)),
    )


def _thread_filter(current_user_id: int, other_user_id: int):
    return or_(
        and_(Message.sender_id == current_user_id, Message.receiver_id == other_user_id),
        and_(Message.sender_id == other_user_id, Message.receiver_id == current_user_id),
    )

async def get_user_from_token(token: str, db: Session):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
        return db.query(User).filter(User.id == int(user_id)).first()
    except JWTError:
        return None

@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    from ..database import SessionLocal
    db = SessionLocal()
    try:
        user = await get_user_from_token(token, db)
        if not user:
            logger.error("WebSocket connection rejected: invalid token")
            await websocket.close(code=4003)
            return

        await manager.connect(user.id, websocket)
        
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received WebSocket data from user {user.id}: {data}")
            message_data = json.loads(data)
            
            receiver_id = message_data.get("receiver_id")
            content = message_data.get("content")
            
            if receiver_id and content:
                # Use a fresh session or ensure current one is active
                receiver_id = int(receiver_id)
                db_message = Message(
                    sender_id=user.id,
                    receiver_id=receiver_id,
                    content=content
                )
                db.add(db_message)
                create_notification(
                    db,
                    user_id=receiver_id,
                    actor_id=user.id,
                    type="message",
                    title=f"New message from {display_name(user)}",
                    body=content[:160],
                    target_type="user",
                    target_id=user.id,
                )
                db.commit()
                db.refresh(db_message)
                logger.info(f"Message saved to database: ID {db_message.id}")
                
                broadcast_data = {
                    "id": db_message.id,
                    "sender_id": db_message.sender_id,
                    "receiver_id": db_message.receiver_id,
                    "content": db_message.content,
                    "created_at": db_message.created_at.isoformat()
                }
                
                await manager.send_personal_message(json.dumps(broadcast_data), receiver_id)
                await manager.send_personal_message(json.dumps(broadcast_data), user.id)
            else:
                logger.warning(f"Invalid message format from user {user.id}")
                
    except WebSocketDisconnect:
        manager.disconnect(user.id, websocket)
    except Exception as e:
        logger.error(f"WebSocket error for user {user.id}: {e}")
        manager.disconnect(user.id, websocket)
    finally:
        db.close()

@router.get("/unread-count", response_model=MessageUnreadCount)
def get_unread_message_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count = db.query(Message).filter(
        Message.receiver_id == current_user.id,
        Message.read_at.is_(None),
        Message.receiver_deleted_at.is_(None),
    ).count()
    return {"unread_count": count}


@router.get("/conversations", response_model=List[ConversationOut])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # This is a bit complex in SQL: get unique users we've chatted with
    # For simplicity, we'll do it in Python for now
    sent = db.query(Message.receiver_id).filter(
        Message.sender_id == current_user.id,
        Message.sender_deleted_at.is_(None),
    ).distinct().all()
    received = db.query(Message.sender_id).filter(
        Message.receiver_id == current_user.id,
        Message.receiver_deleted_at.is_(None),
    ).distinct().all()
    
    user_ids = set([r[0] for r in sent] + [r[0] for r in received])
    
    conversations = []
    for uid in user_ids:
        other_user = db.query(User).filter(User.id == uid).first()
        if other_user:
            # Get last message
            last_msg = db.query(Message).filter(
                _thread_filter(current_user.id, uid),
                _visible_message_filter(current_user.id),
            ).order_by(Message.created_at.desc()).first()
            if not last_msg:
                continue

            unread_count = db.query(Message).filter(
                Message.sender_id == uid,
                Message.receiver_id == current_user.id,
                Message.read_at.is_(None),
                Message.receiver_deleted_at.is_(None),
            ).count()
            
            conversations.append({
                "user": {
                    "id": other_user.id,
                    "username": other_user.username,
                    "full_name": other_user.full_name,
                    "profile_photo_url": other_user.profile_photo_url
                },
                "last_message": last_msg.content if last_msg else "",
                "last_message_at": last_msg.created_at if last_msg else None,
                "unread_count": unread_count,
            })
            
    # Sort by last message time
    conversations.sort(key=lambda x: x["last_message_at"] or "", reverse=True)
    return conversations


@router.delete("/{other_user_id}")
def delete_conversation(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    messages = db.query(Message).filter(
        _thread_filter(current_user.id, other_user_id),
        _visible_message_filter(current_user.id),
    ).all()
    for message in messages:
        if message.sender_id == current_user.id:
            message.sender_deleted_at = now
        if message.receiver_id == current_user.id:
            message.receiver_deleted_at = now
            if message.read_at is None:
                message.read_at = now
    db.commit()
    return {"deleted": len(messages)}

@router.get("/{other_user_id}", response_model=List[MessageOut])
def get_messages(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    messages = db.query(Message).filter(
        _thread_filter(current_user.id, other_user_id),
        _visible_message_filter(current_user.id),
    ).order_by(Message.created_at.asc()).all()
    unread = [
        message for message in messages
        if message.receiver_id == current_user.id and message.read_at is None
    ]
    if unread:
        now = datetime.now(timezone.utc)
        for message in unread:
            message.read_at = now
        db.commit()
    return messages
