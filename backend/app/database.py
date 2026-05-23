import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
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
    
