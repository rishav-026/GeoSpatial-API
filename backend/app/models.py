from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class FileModel(Base):
    """
    Model representing an uploaded geospatial file and its metadata.
    """
    __tablename__ = "files"

    id = Column(String, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    crs = Column(String, nullable=True)                  # Source CRS (e.g. EPSG:4326)
    measurement_crs = Column(String, nullable=True)      # Projected Measurement CRS (e.g. EPSG:32643)
    feature_count = Column(Integer, default=0)
    status = Column(String, nullable=False, default="PROCESSING")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship to associated features
    features = relationship("FeatureModel", back_populates="file", cascade="all, delete-orphan")


class FeatureModel(Base):
    """
    Model representing an individual geospatial feature extracted from a file.
    """
    __tablename__ = "features"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    file_id = Column(String, ForeignKey("files.id", ondelete="CASCADE"), nullable=False)
    feature_index = Column(Integer, nullable=False)
    geometry_type = Column(String, nullable=False)
    geometry = Column(JSON, nullable=True)        # GeoJSON dictionary representation
    properties = Column(JSON, nullable=True)      # Stores feature attributes as JSON
    measurement = Column(Float, nullable=True)
    measurement_unit = Column(String, nullable=True)

    # Relationship to the parent file
    file = relationship("FileModel", back_populates="features")
