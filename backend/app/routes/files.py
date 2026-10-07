import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from shapely.geometry import mapping

from app.database import get_db
from app.models import FileModel, FeatureModel
from app.schemas import FileResponse, MeasurementsResponse, FeatureMeasurementItem
from app.services.geospatial import (
    read_geospatial_file,
    check_and_transform_crs,
    calculate_measurement,
    extract_feature_properties,
)

router = APIRouter(prefix="/api/files", tags=["Files"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload and process a geospatial file (.kml or .zip shapefile).
    Validates file format, extracts features, calculates spatial measurements,
    and stores file metadata and features in the database.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must have a valid filename."
        )

    filename = file.filename
    _, ext = os.path.splitext(filename)
    ext = ext.lower()

    if ext not in [".kml", ".zip"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Only KML and ZIP Shapefiles are allowed."
        )

    # Generate unique ID for the file
    file_id = str(uuid.uuid4())
    saved_filename = f"{file_id}_{filename}"
    file_path = os.path.join(UPLOAD_DIR, saved_filename)

    # Save uploaded file to local disk
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded file: {str(e)}"
        )

    # Create initial database record with PROCESSING status
    db_file = FileModel(
        id=file_id,
        filename=filename,
        file_type=ext,
        crs=None,
        measurement_crs=None,
        feature_count=0,
        status="PROCESSING"
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    try:
        # Step 1: Read geospatial file into GeoDataFrame
        gdf = read_geospatial_file(file_path, ext)

        # Step 2: Check CRS and transform geographic coordinates (e.g. EPSG:4326) to estimated projected UTM CRS
        transformed_gdf, original_crs, measurement_crs = check_and_transform_crs(gdf)

        # Step 3: Extract features, convert geometries to GeoJSON mapping, and calculate measurements
        feature_models = []
        for idx, row in transformed_gdf.iterrows():
            geom = row.geometry
            original_geom = gdf.iloc[idx].geometry if idx < len(gdf) else geom
            geom_type = geom.geom_type if geom is not None else "Unknown"

            # Convert geometry to GeoJSON-compatible dictionary
            geometry_geojson = mapping(original_geom) if original_geom is not None and not original_geom.is_empty else None

            measurement, unit = calculate_measurement(geom)
            properties = extract_feature_properties(row)

            feature_item = FeatureModel(
                file_id=file_id,
                feature_index=int(idx),
                geometry_type=geom_type,
                geometry=geometry_geojson,
                properties=properties,
                measurement=measurement,
                measurement_unit=unit,
            )
            feature_models.append(feature_item)

        # Step 4: Save features to DB and update file status to COMPLETED
        db.add_all(feature_models)
        db_file.crs = original_crs
        db_file.measurement_crs = measurement_crs
        db_file.feature_count = len(feature_models)
        db_file.status = "COMPLETED"
        db.commit()
        db.refresh(db_file)

        return db_file

    except ValueError as ve:
        # Mark file status as FAILED in DB and return HTTP 400 error response
        db_file.status = "FAILED"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        db_file.status = "FAILED"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during processing: {str(e)}"
        )


@router.get("/{id}/", response_model=FileResponse)
def get_file_info(id: str, db: Session = Depends(get_db)):
    """
    Retrieve file metadata by file ID.
    """
    db_file = db.query(FileModel).filter(FileModel.id == id).first()
    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found."
        )
    return db_file


@router.get("/{id}/measurements/", response_model=MeasurementsResponse)
def get_file_measurements(id: str, db: Session = Depends(get_db)):
    """
    Retrieve feature measurements for a specific file by file ID.
    """
    db_file = db.query(FileModel).filter(FileModel.id == id).first()
    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found."
        )

    features = (
        db.query(FeatureModel)
        .filter(FeatureModel.file_id == id)
        .order_by(FeatureModel.feature_index.asc())
        .all()
    )

    return MeasurementsResponse(
        file_id=id,
        features=features
    )
