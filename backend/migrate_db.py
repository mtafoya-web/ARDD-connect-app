import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

MIGRATIONS = [
    ("users", "profile_photo_url", "ALTER TABLE users ADD COLUMN profile_photo_url VARCHAR(512) DEFAULT ''"),
    ("users", "ardd_meta", "ALTER TABLE users ADD COLUMN ardd_meta JSON DEFAULT '{}'"),
    ("users", "phone_number", "ALTER TABLE users ADD COLUMN phone_number VARCHAR(32)"),
    ("users", "auth_provider", "ALTER TABLE users ADD COLUMN auth_provider VARCHAR(32) DEFAULT 'password' NOT NULL"),
    ("users", "google_sub", "ALTER TABLE users ADD COLUMN google_sub VARCHAR(255)"),
    ("users", "reset_token_hash", "ALTER TABLE users ADD COLUMN reset_token_hash VARCHAR(255)"),
    ("users", "reset_token_expires_at", "ALTER TABLE users ADD COLUMN reset_token_expires_at TIMESTAMP WITH TIME ZONE"),
    ("events", "ardd_meta", "ALTER TABLE events ADD COLUMN ardd_meta JSON DEFAULT '{}'"),
]

for table, column, sql in MIGRATIONS:
    with engine.connect() as conn:
        try:
            conn.execute(text(sql))
            conn.commit()
            print(f"[ok] added {table}.{column}")
        except Exception as e:
            conn.rollback()
            msg = str(e).lower()
            if "duplicate column" in msg or "already exists" in msg:
                print(f"[skip] {table}.{column} already exists")
            else:
                print(f"[err] {table}.{column}: {e}")
