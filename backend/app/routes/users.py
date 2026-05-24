from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from typing import Optional
from ..database import get_db
from ..models import User, Follow, Post, Bookmark, Expert
from ..schemas import UserOut, UserUpdate, PostOut, AdminUserUpdate
from ..auth import get_current_user, get_optional_current_user, get_current_active_superuser
from ..utils.user_helpers import populate_user_counts
from ..utils.storage import upload_file, delete_file
from ..utils.post_helpers import attach_interaction_data

router = APIRouter(prefix="/users", tags=["users"])


@router.put("/{user_id}/admin", response_model=UserOut)
def admin_update_user(
    user_id: int,
    data: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Admin-only route to update sensitive user fields like role and ardd_meta.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = data.model_dump(exclude_unset=True)
    
    if "role" in update_data:
        user.role = update_data["role"]
    if "is_superuser" in update_data:
        user.is_superuser = update_data["is_superuser"]
    if "ardd_meta" in update_data:
        current_meta = dict(user.ardd_meta or {})
        current_meta.update(update_data["ardd_meta"])
        user.ardd_meta = current_meta

    db.commit()
    db.refresh(user)
    return populate_user_counts(user, db)


@router.get("/me", response_model=UserOut)
def get_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return populate_user_counts(current_user, db)


@router.put("/me", response_model=UserOut)
def update_me(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if isinstance(value, str):
            value = value.strip()

        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    return populate_user_counts(current_user, db)

@router.post("/me/photo", response_model=UserOut)
async def update_profile_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.content_type:
        raise HTTPException(status_code=400, detail="File type could not be detected")

    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Delete old photo if it exists
    if current_user.profile_photo_public_id:
        delete_file(current_user.profile_photo_public_id)
    
    # Upload new photo
    upload_result = upload_file(file, folder="profile_photos")
    
    current_user.profile_photo_url = upload_result["url"]
    current_user.profile_photo_public_id = upload_result["public_id"]
    
    db.commit()
    db.refresh(current_user)
    
    return populate_user_counts(current_user, db)

@router.delete("/me/photo", response_model=UserOut)
async def remove_profile_photo(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.profile_photo_public_id:
        delete_file(current_user.profile_photo_public_id)
    
    current_user.profile_photo_url = ""
    current_user.profile_photo_public_id = ""
    
    db.commit()
    db.refresh(current_user)
    
    return populate_user_counts(current_user, db)


@router.get("/suggestions", response_model=list[UserOut])
def get_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Suggest users with same affiliation, role or area of study
    # but not already following
    following_ids = db.query(Follow.following_id).filter(Follow.follower_id == current_user.id).all()
    following_ids = [fid[0] for fid in following_ids]
    following_ids.append(current_user.id)

    suggestions = (
        db.query(User)
        .filter(User.id.not_in(following_ids))
        .filter(
            or_(
                User.affiliation == current_user.affiliation,
                User.role == current_user.role,
                User.area_of_study == current_user.area_of_study
            )
        )
        .limit(5)
        .all()
    )

    # If not enough specific suggestions, just show some active users
    if len(suggestions) < 5:
        more_suggestions = (
            db.query(User)
            .filter(User.id.not_in(following_ids))
            .filter(User.id.not_in([u.id for u in suggestions]))
            .limit(5 - len(suggestions))
            .all()
        )
        suggestions.extend(more_suggestions)

    for user in suggestions:
        populate_user_counts(user, db)

    return suggestions


@router.get("/", response_model=list[UserOut])
def list_users(
    q: str | None = Query(default=None, min_length=1, max_length=100),
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if q:
        term = f"%{q.strip().lower()}%"
        query = query.filter(
            or_(
                User.username.ilike(term),
                User.full_name.ilike(term),
                User.affiliation.ilike(term),
                User.area_of_study.ilike(term),
            )
        )

    users = query.order_by(User.created_at.desc()).limit(100).all()
    for user in users:
        populate_user_counts(user, db)
    return users


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return populate_user_counts(user, db)


@router.get("/{user_id}/posts", response_model=list[PostOut])
def get_user_posts(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    posts = (
        db.query(Post)
        .filter(Post.user_id == user_id)
        .order_by(Post.created_at.desc())
        .all()
    )
    
    uid = current_user.id if current_user else None
    for p in posts:
        attach_interaction_data(p, db, uid)
        
    return posts

@router.get("/{user_id}/bookmarks", response_model=list[PostOut])
def get_user_bookmarks(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    posts = (
        db.query(Post)
        .join(Bookmark, Bookmark.post_id == Post.id)
        .options(joinedload(Post.author))
        .filter(Bookmark.user_id == user_id)
        .order_by(Bookmark.created_at.desc())
        .all()
    )

    uid = current_user.id if current_user else None
    for p in posts:
        attach_interaction_data(p, db, uid)

    return posts
