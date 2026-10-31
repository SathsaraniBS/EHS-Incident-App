import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# PostgreSQL connection string
# Uses environment variable if set; defaults to port 5433 with your database credentials
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:adminbss@localhost:5433/ehs_db"
)

# Engine configuration with connection pooling for FastAPI
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verifies connectivity before using a pooled connection
    pool_size=10,        # Maximum number of connections to keep open
    max_overflow=20      # Extra connections allowed beyond pool_size
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base model for SQLAlchemy
Base = declarative_base()

# FastAPI Dependency to yield a clean DB session per request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()