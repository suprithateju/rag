import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from config import settings

# Create a local SQLite database file in the same directory as chroma_db
DB_DIR = os.path.dirname(settings.CHROMA_DB_DIR)
os.makedirs(DB_DIR, exist_ok=True)
SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(DB_DIR, 'documind.db')}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency for FastAPI to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
