import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT profile_photo_url FROM users LIMIT 1"))
        print("Column profile_photo_url exists")
except Exception as e:
    print(f"Error: {e}")
