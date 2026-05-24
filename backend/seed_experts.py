"""
Seed the experts table from the agingpharma_profiles.csv file.
Usage: python seed_experts.py
"""
import csv
import sys
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Base, Expert

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

def seed_experts():
    """Load experts from CSV and insert into database."""
    db = SessionLocal()
    
    try:
        csv_path = "../agingpharma_profiles.csv"
        
        with open(csv_path, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            experts_added = 0
            errors = []
            
            for row in reader:
                try:
                    name = row['name'].strip()[:250]
                    affiliation = row.get('affiliation', '').strip()[:250]
                    field = row.get('general_field_of_study', '').strip()[:95]
                    
                    # Check if expert with this name and affiliation already exists
                    existing = db.query(Expert).filter(
                        Expert.csv_name == name,
                        Expert.csv_affiliation == affiliation
                    ).first()
                    
                    if existing:
                        # print(f"Skipping {name} - already exists")
                        continue
                    
                    # Create new expert record
                    import hashlib
                    email_hash = hashlib.md5(f"{name}{affiliation}".encode()).hexdigest()
                    dummy_email = f"{email_hash}@ardd-expert.internal"

                    expert = Expert(
                        csv_name=name,
                        csv_email=dummy_email,
                        csv_affiliation=affiliation,
                        csv_bio=row.get('biography', '').strip(),
                        csv_field=field,
                        csv_keywords=row.get('field_matched_keywords', '').strip(),
                        csv_confidence_score=int(row.get('field_confidence_score', 0)) if row.get('field_confidence_score', '0').isdigit() else 0,
                        source_url=row.get('source_url', '').strip(),
                        event_year=int(row.get('event_year', 2025)) if row.get('event_year', '2025').isdigit() else 2025,
                        is_claimed=False,
                    )
                    
                    db.add(expert)
                    experts_added += 1
                    
                    if experts_added % 100 == 0:
                        db.commit()
                        print(f"Added {experts_added} experts...")
                    
                except Exception as e:
                    db.rollback()
                    errors.append(f"Row {row.get('name')}: {str(e)}")
                    print(f"Error processing {row.get('name')}: {e}")
        
        db.commit()
        
        print(f"\n✅ Successfully added {experts_added} experts to database")
        if errors:
            print(f"\n⚠️  {len(errors)} rows had errors:")
            for error in errors:
                print(f"  - {error}")
                
    except FileNotFoundError:
        print(f"❌ CSV file not found at {csv_path}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_experts()
