from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint, Boolean, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, backref

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String(30), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone_number = Column(String(32), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    auth_provider = Column(String(32), default="password", nullable=False)
    google_sub = Column(String(255), unique=True, index=True, nullable=True)
    reset_token_hash = Column(String(255), nullable=True)
    reset_token_expires_at = Column(DateTime(timezone=True), nullable=True)

    full_name = Column(String(100), default="")
    bio = Column(Text, default="")
    affiliation = Column(String(150), default="")
    role = Column(String(100), default="user") # 'user' or 'admin'
    is_superuser = Column(Boolean, default=False)
    area_of_study = Column(String(150), index=True, default="")
    research_interests = Column(Text, default="")
    looking_for = Column(Text, default="")
    location = Column(String(100), default="")
    website = Column(String(255), default="")
    profile_photo_url = Column(String(512), default="")
    profile_photo_public_id = Column(String(255), default="")

    ardd_meta = Column(JSON, default=dict)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    posts = relationship("Post", back_populates="author")
    likes = relationship("Like", back_populates="user")
    bookmarks = relationship("Bookmark", back_populates="user")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(255), nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    image_url = Column(String(512), default="")
    image_public_id = Column(String(255), default="")
    status = Column(String(50), default="draft") # draft, current, past

    ardd_meta = Column(JSON, default=dict)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), default="")
    content = Column(Text, nullable=False)
    category = Column(String(100), default="general")
    status = Column(String(50), default="published") # draft, published, archived
    media = Column(JSON, default=list) # Array of media objects: [{type, url, publicId, altText}]
    
    ardd_meta = Column(JSON, default=dict)
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Relationships for threaded conversations and reposts
    parent_id = Column(Integer, ForeignKey("posts.id"), nullable=True, index=True)
    post_type = Column(String(50), default="original") # original, reply, repost
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    author = relationship("User", back_populates="posts")
    parent = relationship("Post", remote_side=[id], backref="children")
    
    likes = relationship("Like", back_populates="post", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="post", cascade="all, delete-orphan")

    @property
    def username(self):
        return self.author.username if self.author else ""

    @property
    def user(self):
        return self.author


class Like(Base):
    __tablename__ = "likes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="likes")
    post = relationship("Post", back_populates="likes")
    
    __table_args__ = (UniqueConstraint("user_id", "post_id", name="unique_like"),)


class Bookmark(Base):
    __tablename__ = "bookmarks"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="bookmarks")
    post = relationship("Post", back_populates="bookmarks")
    
    __table_args__ = (UniqueConstraint("user_id", "post_id", name="unique_bookmark"),)


class Follow(Base):
    __tablename__ = "follows"

    id = Column(Integer, primary_key=True, index=True)

    follower_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    following_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Cannot follow the same person multiple times
    __table_args__ = (
        UniqueConstraint("follower_id", "following_id", name="unique_follow"),
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)

    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    content = Column(Text, nullable=False)

    read_at = Column(DateTime(timezone=True), nullable=True)
    sender_deleted_at = Column(DateTime(timezone=True), nullable=True)
    receiver_deleted_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    type = Column(String(50), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    body = Column(Text, default="")
    target_type = Column(String(50), nullable=True)
    target_id = Column(Integer, nullable=True)

    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", foreign_keys=[user_id])
    actor = relationship("User", foreign_keys=[actor_id])


class Expert(Base):
    __tablename__ = "experts"

    id = Column(Integer, primary_key=True, index=True)

    # CSV data
    csv_name = Column(String(255), nullable=False, index=True)
    csv_email = Column(String(255), unique=True, nullable=False, index=True)
    csv_affiliation = Column(String(255), default="")
    csv_bio = Column(Text, default="")
    csv_field = Column(String(100), default="")  # Field of study
    csv_keywords = Column(Text, default="")  # Comma-separated keywords
    csv_confidence_score = Column(Integer, default=0)  # 0-4
    source_url = Column(String(512), default="")
    event_year = Column(Integer, default=2025)

    # Claim tracking
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, unique=True)
    is_claimed = Column(Boolean, default=False, index=True)
    claimed_at = Column(DateTime(timezone=True), nullable=True)

    # Admin verification for manual claims
    verified_by_admin = Column(Boolean, default=False)
    admin_verified_at = Column(DateTime(timezone=True), nullable=True)
    verified_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", foreign_keys=[user_id], backref=backref("expert_record", uselist=False))
    verified_by = relationship("User", foreign_keys=[verified_by_user_id])
