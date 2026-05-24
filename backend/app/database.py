import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy import inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

### Load Enviorment Files ###
load_dotenv()

### Get the DATABASE url from the  ###
DATABASE_URL = os.getenv("DATABASE_URL")
## Checks for existence ##
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

### sql alchemy create database ###
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True #Avoid random database connection errors
)

### sql alchemy session maker ###
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)

### The parent class that the database models will inherit from ###
## class User(Base):
Base = declarative_base()


def ensure_runtime_schema():
    """Apply tiny additive schema fixes for deployments without migrations."""
    inspector = inspect(engine)
    if "messages" not in inspector.get_table_names():
        return

    existing = {column["name"] for column in inspector.get_columns("messages")}
    additions = {
        "read_at": "TIMESTAMP",
        "sender_deleted_at": "TIMESTAMP",
        "receiver_deleted_at": "TIMESTAMP",
    }

    with engine.begin() as connection:
        for name, sql_type in additions.items():
            if name not in existing:
                connection.execute(text(f"ALTER TABLE messages ADD COLUMN {name} {sql_type}"))
        if "read_at" not in existing:
            connection.execute(text("UPDATE messages SET read_at = created_at WHERE read_at IS NULL"))

### Dependancy function that creates and provides a database session ###
def get_db():
    ## Create a new database session ##
    db = SessionLocal()

    try:
        ## Give the session to whatever code needs it
        yield db
    finally:
        ## Close session when request is finished
        db.close()
    
