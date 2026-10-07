from typing import Dict, List, Optional, Any
from pydantic import BaseModel, ConfigDict, Field


class FileResponse(BaseModel):
    """
    Schema representing file metadata in API response (GET /api/files/{id}/).
    """
    id: str
    filename: str
    feature_count: int
    crs: Optional[str] = None
    measurement_crs: Optional[str] = None
    status: str

    model_config = ConfigDict(from_attributes=True)


class FeatureMeasurementItem(BaseModel):
    """
    Schema representing measurement, geometry, and attributes for a single feature.
    Maps database fields feature_index -> feature_id and measurement_unit -> unit.
    """
    feature_id: int = Field(..., validation_alias="feature_index", serialization_alias="feature_id")
    geometry_type: str
    geometry: Optional[Dict[str, Any]] = None
    measurement: Optional[float] = None
    unit: Optional[str] = Field(None, validation_alias="measurement_unit", serialization_alias="unit")
    properties: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)


class MeasurementsResponse(BaseModel):
    """
    Schema for complete file measurements API response (GET /api/files/{id}/measurements/).
    """
    file_id: str
    features: List[FeatureMeasurementItem]

    model_config = ConfigDict(from_attributes=True)
