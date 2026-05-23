from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import get_settings
from .database import Base, engine
from .models import * 
from .routes import auth, users, posts, follows, events, media, messages, matches, sessions, bot

Base.metadata.create_all(bind=engine)
settings = get_settings()

app = FastAPI(
    title="ARDD-connect",
    version="0.1.0",
)

if settings.cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )
elif settings.is_development:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^http://(localhost|127\.0\.0\.1):\d+$",
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(posts.router)
app.include_router(follows.router)
app.include_router(events.router)
app.include_router(media.router)
app.include_router(messages.router)
app.include_router(matches.router)
app.include_router(sessions.router)
app.include_router(bot.router)

settings.upload_root.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_root), name="uploads")

@app.get("/")
def root():
    return {"message": "API is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
