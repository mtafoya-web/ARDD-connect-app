import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

MIGRATIONS = [
    ("users", "profile_photo_url", "ALTER TABLE users ADD COLUMN profile_photo_url VARCHAR(512) DEFAULT ''"),
    ("users", "ardd_meta", "ALTER TABLE users ADD COLUMN ardd_meta JSON DEFAULT '{}'"),
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
