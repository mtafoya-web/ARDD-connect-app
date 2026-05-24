from sqlalchemy.orm import Session

from ..models import Follow, Notification, User


def display_name(user: User | None) -> str:
    if not user:
        return "Someone"
    return user.full_name or user.username


def create_notification(
    db: Session,
    *,
    user_id: int,
    actor_id: int | None,
    type: str,
    title: str,
    body: str = "",
    target_type: str | None = None,
    target_id: int | None = None,
) -> Notification | None:
    if actor_id is not None and user_id == actor_id:
        return None

    notification = Notification(
        user_id=user_id,
        actor_id=actor_id,
        type=type,
        title=title,
        body=body,
        target_type=target_type,
        target_id=target_id,
    )
    db.add(notification)
    return notification


def notify_followers_of_post(db: Session, post_author: User, post_id: int, content: str) -> None:
    followers = db.query(Follow.follower_id).filter(Follow.following_id == post_author.id).all()
    title = f"{display_name(post_author)} posted"
    body = content[:160]
    for (follower_id,) in followers:
        create_notification(
            db,
            user_id=follower_id,
            actor_id=post_author.id,
            type="post",
            title=title,
            body=body,
            target_type="post",
            target_id=post_id,
        )
