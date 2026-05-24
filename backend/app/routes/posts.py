from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from ..database import get_db
from ..models import Post, User, Follow, Like, Bookmark
from ..schemas import PostCreate, PostUpdate, PostOut
from ..auth import get_current_user, get_current_active_superuser, get_optional_current_user
from ..utils.post_helpers import attach_interaction_data
from ..utils.notifications import create_notification, display_name, notify_followers_of_post

router = APIRouter(prefix="/posts", tags=["posts"])


@router.post("/", response_model=PostOut)
def create_post(
    data: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # If a user is not admin, they can't set certain fields or must be published by default
    post_data = data.model_dump()
    if not current_user.is_superuser:
        post_data['status'] = 'published' # Regular users always publish
        
        # Restriction: Only admins or "allowed users" can post official announcements
        if post_data.get('category') == 'announcement':
            can_post = current_user.ardd_meta.get('can_post_announcements') if current_user.ardd_meta else False
            if not can_post:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only admins and authorized users can post official ARDD updates"
                )

        # Only allow general category for non-admins if not specified
        if not post_data.get('category'):
            post_data['category'] = 'general'
    
    post = Post(
        **post_data,
        user_id=current_user.id,
    )

    db.add(post)
    db.commit()
    db.refresh(post)

    if post.post_type == "reply" and post.parent_id:
        parent = db.query(Post).filter(Post.id == post.parent_id).first()
        if parent:
            create_notification(
                db,
                user_id=parent.user_id,
                actor_id=current_user.id,
                type="comment",
                title=f"{display_name(current_user)} commented on your post",
                body=post.content[:160],
                target_type="post",
                target_id=parent.id,
            )
            db.commit()
    elif post.post_type == "original" and post.status == "published":
        notify_followers_of_post(db, current_user, post.id, post.content)
        db.commit()

    db_post = (
        db.query(Post)
        .options(joinedload(Post.author))
        .filter(Post.id == post.id)
        .first()
    )
    return attach_interaction_data(db_post, db, current_user.id)


@router.get("/global", response_model=List[PostOut])
def global_feed(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    query = (
        db.query(Post)
        .options(joinedload(Post.author))
        .filter(Post.status == "published")
        .filter(Post.post_type != "reply")
    )
    
    if category:
        query = query.filter(Post.category == category)
        
    posts = (
        query.order_by(Post.created_at.desc())
        .limit(50)
        .all()
    )
    user_id = current_user.id if current_user else None
    for p in posts:
        attach_interaction_data(p, db, user_id)
    return posts


@router.get("/home", response_model=List[PostOut])
def home_feed(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    following_ids = (
        db.query(Follow.following_id)
        .filter(Follow.follower_id == current_user.id)
        .subquery()
    )

    posts = (
        db.query(Post)
        .options(joinedload(Post.author))
        .filter(Post.status == "published")
        .filter(Post.post_type != "reply")
        .filter(
            (Post.user_id.in_(following_ids))
            | (Post.user_id == current_user.id)
        )
        .order_by(Post.created_at.desc())
        .limit(50)
        .all()
    )
    for p in posts:
        attach_interaction_data(p, db, current_user.id)
    return posts

@router.get("/admin", response_model=List[PostOut])
def get_admin_posts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    posts = (
        db.query(Post)
        .options(joinedload(Post.author))
        .order_by(Post.created_at.desc())
        .all()
    )
    for p in posts:
        attach_interaction_data(p, db, current_user.id)
    return posts

@router.get("/{post_id}", response_model=PostOut)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    post = db.query(Post).options(joinedload(Post.author)).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    user_id = current_user.id if current_user else None
    return attach_interaction_data(post, db, user_id)

@router.get("/{post_id}/replies", response_model=List[PostOut])
def get_post_replies(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    parent_post = db.query(Post).filter(Post.id == post_id).first()
    if not parent_post:
        raise HTTPException(status_code=404, detail="Post not found")

    replies = (
        db.query(Post)
        .options(joinedload(Post.author))
        .filter(Post.parent_id == post_id, Post.post_type == "reply")
        .order_by(Post.created_at.asc())
        .all()
    )

    user_id = current_user.id if current_user else None
    for reply in replies:
        attach_interaction_data(reply, db, user_id)

    return replies

@router.put("/{post_id}", response_model=PostOut)
def update_post(
    post_id: int,
    data: PostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Only author or superuser can update
    if post.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to update this post")
    
    update_data = data.model_dump(exclude_unset=True)
    
    # Media handling: if it's a list of dicts, it's fine for JSON column
    for field, value in update_data.items():
        if field == 'media' and value is not None:
            # Convert MediaItem models to dicts for JSON storage
            setattr(post, field, [m.model_dump() for m in value])
        else:
            setattr(post, field, value)
    
    db.commit()
    db.refresh(post)
    
    db_post = (
        db.query(Post)
        .options(joinedload(Post.author))
        .filter(Post.id == post.id)
        .first()
    )
    return attach_interaction_data(db_post, db, current_user.id)

@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Only author or superuser can delete
    if post.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    
    db.delete(post)
    db.commit()
    return None


# --- Interactions ---

@router.post("/{post_id}/like")
def toggle_like(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    like = db.query(Like).filter(Like.post_id == post_id, Like.user_id == current_user.id).first()
    if like:
        db.delete(like)
        db.commit()
        return {"liked": False}
    else:
        new_like = Like(post_id=post_id, user_id=current_user.id)
        db.add(new_like)
        create_notification(
            db,
            user_id=post.user_id,
            actor_id=current_user.id,
            type="like",
            title=f"{display_name(current_user)} liked your post",
            body=post.content[:160],
            target_type="post",
            target_id=post.id,
        )
        db.commit()
        return {"liked": True}


@router.post("/{post_id}/bookmark")
def toggle_bookmark(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    bookmark = db.query(Bookmark).filter(Bookmark.post_id == post_id, Bookmark.user_id == current_user.id).first()
    if bookmark:
        db.delete(bookmark)
        db.commit()
        return {"bookmarked": False}
    else:
        new_bookmark = Bookmark(post_id=post_id, user_id=current_user.id)
        db.add(new_bookmark)
        db.commit()
        return {"bookmarked": True}


@router.post("/{post_id}/repost", response_model=PostOut)
def repost(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if already reposted
    existing_repost = db.query(Post).filter(
        Post.parent_id == post_id, 
        Post.user_id == current_user.id, 
        Post.post_type == "repost"
    ).first()
    
    if existing_repost:
        # Toggle: if already reposted, delete it
        db.delete(existing_repost)
        db.commit()
        # Return something to indicate it's gone? Or just return the original post updated?
        # For simplicity, let's return the original post with updated counts
        db.refresh(post)
        return attach_interaction_data(post, db, current_user.id)

    new_repost = Post(
        content=post.content, # Or empty content for a pure repost
        user_id=current_user.id,
        parent_id=post_id,
        post_type="repost",
        status="published"
    )
    db.add(new_repost)
    db.commit()
    db.refresh(new_repost)

    create_notification(
        db,
        user_id=post.user_id,
        actor_id=current_user.id,
        type="repost",
        title=f"{display_name(current_user)} reposted your post",
        body=post.content[:160],
        target_type="post",
        target_id=post.id,
    )
    db.commit()
    
    db_repost = db.query(Post).options(joinedload(Post.author)).filter(Post.id == new_repost.id).first()
    return attach_interaction_data(db_repost, db, current_user.id)
