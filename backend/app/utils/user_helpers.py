from sqlalchemy.orm import Session
from ..models import User, Follow

def populate_user_counts(user: User, db: Session):
    """
    Populate followers/following counts and expert profile info for a User object.
    Matches the UserOut schema.
    """
    if user is None:
        return user

    user.followers_count = db.query(Follow).filter(Follow.following_id == user.id).count()
    user.following_count = db.query(Follow).filter(Follow.follower_id == user.id).count()
    
    # expert_record is the SQLAlchemy relationship (1-to-1)
    # We check if it exists and is claimed.
    expert = getattr(user, 'expert_record', None)
    if expert and expert.is_claimed:
        user.is_expert = True
        user.expert_profile = {
            "field": expert.csv_field,
            "keywords": expert.csv_keywords
        }
    else:
        user.is_expert = False
        user.expert_profile = None
    
    return user
