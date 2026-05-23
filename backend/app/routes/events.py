from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Event, User
from ..schemas import EventCreate, EventUpdate, EventOut
from ..auth import get_current_user, get_current_active_superuser

router = APIRouter(
    prefix="/events",
    tags=["events"],
)

@router.get("/", response_model=List[EventOut])
def get_events(
    db: Session = Depends(get_db),
    status: str | None = None
):
    query = db.query(Event)
    if status:
        query = query.filter(Event.status == status)
    else:
        # By default, public users only see 'current' and 'past'
        query = query.filter(Event.status.in_(["current", "past"]))
    
    return query.all()

@router.get("/admin", response_model=List[EventOut])
def get_admin_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    return db.query(Event).all()

@router.post("/", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_event(
    event_in: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    event = Event(
        **event_in.model_dump(),
        created_by=current_user.id
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@router.get("/{event_id}", response_model=EventOut)
def get_event(
    event_id: int,
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.put("/{event_id}", response_model=EventOut)
def update_event(
    event_id: int,
    event_in: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    update_data = event_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)
    
    db.commit()
    db.refresh(event)
    return event

@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(event)
    db.commit()
    return None
