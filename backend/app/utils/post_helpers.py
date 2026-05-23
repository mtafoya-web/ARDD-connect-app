from sqlalchemy.orm import Session, joinedload
from typing import Optional
from ..models import Post, Like, Bookmark

def attach_interaction_data(post: Post, db: Session, current_user_id: Optional[int] = None):
    """Helper to attach counts and user-specific flags to a post object for PostOut schema."""
    if post is None:
        return post

    post.likes_count = db.query(Like).filter(Like.post_id == post.id).count()
    post.bookmarks_count = db.query(Bookmark).filter(Bookmark.post_id == post.id).count()
    post.replies_count = db.query(Post).filter(Post.parent_id == post.id, Post.post_type == "reply").count()
    post.reposts_count = db.query(Post).filter(Post.parent_id == post.id, Post.post_type == "repost").count()
    post.repost_of = None

    if post.post_type == "repost" and post.parent_id:
        original = (
            db.query(Post)
            .options(joinedload(Post.author))
            .filter(Post.id == post.parent_id)
            .first()
        )
        if original:
            original.likes_count = db.query(Like).filter(Like.post_id == original.id).count()
            original.bookmarks_count = db.query(Bookmark).filter(Bookmark.post_id == original.id).count()
            original.replies_count = db.query(Post).filter(Post.parent_id == original.id, Post.post_type == "reply").count()
            original.reposts_count = db.query(Post).filter(Post.parent_id == original.id, Post.post_type == "repost").count()
            original.reposted_by_me = False
            original.liked_by_me = False
            original.bookmarked_by_me = False
            post.repost_of = original
    
    if current_user_id:
        post.liked_by_me = db.query(Like).filter(Like.post_id == post.id, Like.user_id == current_user_id).first() is not None
        post.bookmarked_by_me = db.query(Bookmark).filter(Bookmark.post_id == post.id, Bookmark.user_id == current_user_id).first() is not None
        post.reposted_by_me = db.query(Post).filter(Post.parent_id == post.id, Post.user_id == current_user_id, Post.post_type == "repost").first() is not None
    else:
        post.liked_by_me = False
        post.bookmarked_by_me = False
        post.reposted_by_me = False
    return post
