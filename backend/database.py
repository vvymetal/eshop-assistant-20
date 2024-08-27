from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .config.main import config

SQLALCHEMY_DATABASE_URL = config.DATABASE_URL

if SQLALCHEMY_DATABASE_URL is None:
    raise ValueError("DATABASE_URL is not set in the configuration")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()