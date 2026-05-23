import hashlib
import re
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..models import User, Follow
from ..schemas import (
    GoogleLoginRequest,
    LoginResponse,
    PasswordResetConfirm,
    PasswordResetRequest,
    PasswordResetResponse,
    UserCreate,
    UserOut,
)
from ..auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


def normalize_username(username: str) -> str:
    return username.strip().lower()


def normalize_email(email: str) -> str:
    return email.strip().lower()


def validate_real_email(email: str) -> None:
    domain = email.rsplit("@", 1)[-1]
    if "." not in domain or domain.endswith("."):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enter a valid email address",
        )


def normalize_phone(phone_number: str | None) -> str | None:
    if not phone_number:
        return None

    normalized = re.sub(r"[^\d+]", "", phone_number.strip())
    digits = re.sub(r"\D", "", normalized)
    if len(digits) < 7 or len(digits) > 15:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enter a valid phone number",
        )
    return normalized


def make_username_from_email(email: str, db: Session) -> str:
    base = re.sub(r"[^a-z0-9_]", "_", email.split("@", 1)[0].lower()).strip("_")
    base = (base or "user")[:24]
    username = base
    counter = 1
    while db.query(User).filter(User.username == username).first():
        suffix = f"_{counter}"
        username = f"{base[:30 - len(suffix)]}{suffix}"
        counter += 1
    return username


def issue_login_response(user: User) -> dict:
    token = create_access_token({"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }


def attach_default_follow(user: User, db: Session) -> None:
    admin = db.query(User).filter(User.username == "ardd").first()
    if admin and admin.id != user.id:
        existing_follow = db.query(Follow).filter(
            Follow.follower_id == user.id,
            Follow.following_id == admin.id,
        ).first()
        if not existing_follow:
            db.add(Follow(follower_id=user.id, following_id=admin.id))
            db.commit()


def hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, db: Session = Depends(get_db)):
    username = normalize_username(data.username)
    email = normalize_email(data.email)
    validate_real_email(email)
    phone_number = normalize_phone(data.phone_number)

    query = (User.username == username) | (User.email == email)
    if phone_number:
        query = query | (User.phone_number == phone_number)

    existing = db.query(User).filter(query).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username, email, or phone number already exists",
        )

    user = User(
        username=username,
        email=email,
        phone_number=phone_number,
        password_hash=hash_password(data.password),
        auth_provider="password",
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    attach_default_follow(user, db)

    return user


@router.post("/login", response_model=LoginResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    identifier = form_data.username.strip().lower()

    user = db.query(User).filter(
        (User.username == identifier) | (User.email == identifier)
    ).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username, email, or password",
        )

    return issue_login_response(user)


@router.post("/google", response_model=LoginResponse)
def google_login(data: GoogleLoginRequest, db: Session = Depends(get_db)):
    settings = get_settings()
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google login is not configured",
        )

    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google login dependency is not installed",
        )

    try:
        payload = id_token.verify_oauth2_token(
            data.credential,
            google_requests.Request(),
            settings.google_client_id,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google credential",
        )

    email = normalize_email(str(payload.get("email", "")))
    google_sub = str(payload.get("sub", ""))
    if not email or not google_sub or not payload.get("email_verified"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google account email must be verified",
        )

    user = db.query(User).filter(User.google_sub == google_sub).first()
    if not user:
        user = db.query(User).filter(User.email == email).first()

    if user:
        user.google_sub = google_sub
        user.auth_provider = "google"
    else:
        user = User(
            username=make_username_from_email(email, db),
            email=email,
            password_hash=hash_password(secrets.token_urlsafe(32)[:32]),
            auth_provider="google",
            google_sub=google_sub,
            full_name=str(payload.get("name") or ""),
            profile_photo_url=str(payload.get("picture") or ""),
        )
        db.add(user)

    db.commit()
    db.refresh(user)
    attach_default_follow(user, db)
    return issue_login_response(user)


@router.post("/password-reset/request", response_model=PasswordResetResponse)
def request_password_reset(
    data: PasswordResetRequest,
    db: Session = Depends(get_db),
):
    identifier = data.identifier.strip().lower()
    phone_number = None
    if "@" not in identifier and any(ch.isdigit() for ch in data.identifier):
        try:
            phone_number = normalize_phone(data.identifier)
        except HTTPException:
            phone_number = None

    user = db.query(User).filter(User.email == identifier).first()
    if not user and phone_number:
        user = db.query(User).filter(User.phone_number == phone_number).first()

    generic_message = "If that email or phone number is registered, password reset instructions are available."
    if not user:
        return {"message": generic_message}

    token = secrets.token_urlsafe(32)
    user.reset_token_hash = hash_reset_token(token)
    user.reset_token_expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
    db.commit()

    # Development build: surface the token so the reset flow can be completed
    # without an email/SMS provider. Production should send this out-of-band.
    response = {"message": generic_message}
    if get_settings().is_development:
        response["reset_token"] = token
    return response


@router.post("/password-reset/confirm")
def confirm_password_reset(
    data: PasswordResetConfirm,
    db: Session = Depends(get_db),
):
    token_hash = hash_reset_token(data.token)
    user = db.query(User).filter(User.reset_token_hash == token_hash).first()

    now = datetime.now(timezone.utc)
    expires_at = user.reset_token_expires_at if user else None
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if not user or not expires_at or expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token",
        )

    user.password_hash = hash_password(data.password)
    user.reset_token_hash = None
    user.reset_token_expires_at = None
    if user.auth_provider != "google":
        user.auth_provider = "password"
    db.commit()
    return {"message": "Password has been reset"}
