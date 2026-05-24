"""
What data the client is allowed to send
What data the API returns
Validation rules

Create schemas describe what the user/client sends to your API.
Out schemas describe what your API sends back.
"""

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# -------------------------
# User / Auth Schemas
# -------------------------

class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    email: EmailStr
    phone_number: str | None = Field(default=None, max_length=32)
    password: str = Field(min_length=8, max_length=72)


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=100)
    bio: str | None = Field(default=None, max_length=500)
    affiliation: str | None = Field(default=None, max_length=150)
    role: str | None = Field(default=None, max_length=100)
    area_of_study: str | None = Field(default=None, max_length=150)
    research_interests: str | None = Field(default=None, max_length=1000)
    looking_for: str | None = Field(default=None, max_length=1000)
    location: str | None = Field(default=None, max_length=100)
    website: str | None = Field(default=None, max_length=255)
    profile_photo_url: str | None = Field(default=None, max_length=512)
    ardd_meta: dict | None = None


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    phone_number: str | None = None
    bio: str | None = ""

    full_name: str | None = ""
    affiliation: str | None = ""
    role: str | None = ""
    is_superuser: bool = False
    area_of_study: str | None = ""
    research_interests: str | None = ""
    looking_for: str | None = ""
    location: str | None = ""
    website: str | None = ""
    profile_photo_url: str | None = ""
    ardd_meta: dict | None = None
    is_expert: bool = False

    followers_count: int = 0
    following_count: int = 0

    created_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    password: str = Field(min_length=8, max_length=72)


class GoogleLoginRequest(BaseModel):
    credential: str = Field(min_length=20)


class PasswordResetRequest(BaseModel):
    identifier: str = Field(min_length=3, max_length=255)


class PasswordResetConfirm(BaseModel):
    token: str = Field(min_length=20, max_length=255)
    password: str = Field(min_length=8, max_length=72)


class PasswordResetResponse(BaseModel):
    message: str
    reset_token: str | None = None


class TokenUserOut(BaseModel):
    id: int
    username: str
    email: str
    phone_number: str | None = None

    full_name: str | None = ""
    affiliation: str | None = ""
    role: str | None = ""
    is_superuser: bool = False
    area_of_study: str | None = ""

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: TokenUserOut


# -------------------------
# Event Schemas
# -------------------------

class EventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str
    location: str = Field(..., max_length=255)
    start_date: datetime
    end_date: datetime
    image_url: str | None = None
    status: str = "draft"
    ardd_meta: dict | None = None


class EventUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    location: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    image_url: str | None = None
    status: str | None = None
    ardd_meta: dict | None = None


class EventOut(BaseModel):
    id: int
    title: str
    description: str
    location: str
    start_date: datetime
    end_date: datetime
    image_url: str | None
    status: str
    created_by: int
    created_at: datetime
    updated_at: datetime
    ardd_meta: dict | None = None

    class Config:
        from_attributes = True


# -------------------------
# Post Schemas
# -------------------------

class MediaItem(BaseModel):
    type: str
    url: str
    publicId: str | None = None
    altText: str | None = None


class PostCreate(BaseModel):
    title: str | None = Field(default="", max_length=255)
    content: str = Field(min_length=1)
    category: str = "general"
    status: str = "published"
    media: list[MediaItem] = Field(default_factory=list)
    parent_id: int | None = None
    post_type: str = "original"


class PostUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    category: str | None = None
    status: str | None = None
    media: list[MediaItem] | None = None


class RepostSourceOut(BaseModel):
    id: int
    title: str
    content: str
    user_id: int
    username: str
    author: UserOut | None = None

    class Config:
        from_attributes = True


class PostOut(BaseModel):
    id: int
    title: str
    content: str
    category: str
    status: str
    media: list[MediaItem]
    user_id: int
    username: str
    created_at: datetime
    updated_at: datetime
    author: UserOut
    ardd_meta: dict | None = None
    
    parent_id: int | None = None
    post_type: str = "original"
    repost_of: RepostSourceOut | None = None
    
    likes_count: int = 0
    bookmarks_count: int = 0
    replies_count: int = 0
    reposts_count: int = 0
    
    liked_by_me: bool = False
    bookmarked_by_me: bool = False
    reposted_by_me: bool = False

    class Config:
        from_attributes = True


# -------------------------
# Message Schemas
# -------------------------

class MessageCreate(BaseModel):
    receiver_id: int
    content: str = Field(min_length=1, max_length=1000)


class MessageOut(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    read_at: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationUserOut(BaseModel):
    id: int
    username: str
    full_name: str | None = ""
    profile_photo_url: str | None = ""


class ConversationOut(BaseModel):
    user: ConversationUserOut
    last_message: str
    last_message_at: datetime | None = None
    unread_count: int = 0


class MessageUnreadCount(BaseModel):
    unread_count: int


# -------------------------
# Notification Schemas
# -------------------------

class NotificationActorOut(BaseModel):
    id: int
    username: str
    full_name: str | None = ""
    profile_photo_url: str | None = ""

    class Config:
        from_attributes = True


class NotificationOut(BaseModel):
    id: int
    type: str
    title: str
    body: str | None = ""
    target_type: str | None = None
    target_id: int | None = None
    read_at: datetime | None = None
    created_at: datetime
    actor: NotificationActorOut | None = None

    class Config:
        from_attributes = True


class NotificationUnreadCount(BaseModel):
    unread_count: int


# -------------------------
# Expert Schemas
# -------------------------

class ExpertOut(BaseModel):
    id: int
    csv_name: str
    csv_email: str
    csv_affiliation: str
    csv_bio: str
    csv_field: str
    csv_keywords: str
    csv_confidence_score: int
    source_url: str
    event_year: int
    is_claimed: bool
    claimed_at: datetime | None = None
    verified_by_admin: bool = False
    user_id: int | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ExpertWithUserOut(ExpertOut):
    """Expert with claimed user's basic info"""
    user: UserOut | None = None


class ExpertClaimRequest(BaseModel):
    """Request to claim an expert profile by email"""
    email: EmailStr


class ExpertVerificationRequest(BaseModel):
    """Request admin to verify expert claim"""
    csv_name: str = Field(min_length=1, max_length=255)
    csv_affiliation: str = Field(min_length=1, max_length=255)


class ExpertClaimResponse(BaseModel):
    """Response when claiming an expert profile"""
    success: bool
    message: str
    expert: ExpertOut | None = None
    requires_admin_verification: bool = False
