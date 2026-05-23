import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parents[1]


def _csv(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip().rstrip("/") for item in value.split(",") if item.strip()]


class Settings:
    environment: str = os.getenv("ENVIRONMENT", "development").lower()
    database_url: str | None = os.getenv("DATABASE_URL")
    public_base_url: str = os.getenv("PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/")
    cors_origins: list[str] = _csv(os.getenv("BACKEND_CORS_ORIGINS"))
    max_upload_bytes: int = int(os.getenv("MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)))
    upload_root: Path = Path(os.getenv("UPLOAD_ROOT", str(BASE_DIR / "uploads"))).resolve()

    @property
    def is_development(self) -> bool:
        return self.environment in {"dev", "development", "local"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
