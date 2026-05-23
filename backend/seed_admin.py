import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import User
from app.auth import hash_password

load_dotenv()

def seed_admin():
    db: Session = SessionLocal()
    
    admin_username = "ardd" # lowercase for consistency with normalization
    admin_email = os.getenv("ADMIN_EMAIL", "admin@ardd.com")
    admin_password = os.getenv("ADMIN_PASSWORD")
    
    if not admin_password:
        print("ADMIN_PASSWORD not set in .env. Skipping admin seeding.")
        return

    # Check if admin already exists by email
    admin = db.query(User).filter(User.email == admin_email).first()
    
    if not admin:
        # Also check by username just in case email changed
        admin = db.query(User).filter(User.username == admin_username).first()

    if not admin:
        print(f"Creating superuser {admin_username}...")
        admin = User(
            username=admin_username,
            email=admin_email,
            password_hash=hash_password(admin_password),
            role="admin",
            is_superuser=True,
            full_name="ARRD Administrator"
        )
        db.add(admin)
        db.commit()
        print("Superuser created successfully.")
    else:
        print("Superuser already exists. Updating fields...")
        # Ensure is_superuser is set and username is correct (lowercase)
        admin.username = admin_username
        admin.is_superuser = True
        admin.role = "admin"
        # Optional: update password if needed, but usually we don't want to reset it every time
        # unless it's a fresh seed.
        admin.password_hash = hash_password(admin_password)
        db.commit()
        print("Updated existing user to superuser with normalized username and provided password.")
            
    db.close()

if __name__ == "__main__":
    seed_admin()
