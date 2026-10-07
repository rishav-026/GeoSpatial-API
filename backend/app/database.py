from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# SQLite database file URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./geospatial.db"

# Create SQLAlchemy engine for SQLite
# check_same_thread=False allows multiple threads/requests to share the SQLite connection safely in FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Create sessionmaker factory for DB operations
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base declarative model class
Base = declarative_base()


# Dependency function to provide a DB session to routes and close it afterwards
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
