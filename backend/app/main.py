from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import files

# Create database tables automatically on application startup
Base.metadata.create_all(bind=engine)

# Initialize FastAPI application
app = FastAPI(
    title="Geospatial File Measurement API",
    description="Minimal backend service for processing KML and Shapefile ZIP files and calculating feature spatial measurements.",
    version="1.0.0",
)

# Enable CORS for local frontend development (e.g., http://localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(files.router)


@app.get("/")
def root():
    """
    Health check and root endpoint.
    """
    return {
        "message": "Welcome to Geospatial File Measurement API",
        "docs_url": "/docs",
        "status": "online"
    }
