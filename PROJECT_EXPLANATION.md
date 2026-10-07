# Comprehensive Codebase & Flow Walkthrough

This document provides a beginner-friendly, line-by-line code and architecture guide for the **Geospatial File Measurement API**.

---

## 1. Application Startup Sequence

1. **Entry Point (`app/main.py`)**:
   - When Uvicorn starts (`uvicorn app.main:app --reload`), it loads `app/main.py`.
   - `Base.metadata.create_all(bind=engine)` is called. This inspects all SQLAlchemy ORM models (`FileModel`, `FeatureModel`) and creates the `geospatial.db` SQLite database file and tables if they do not exist.
   - FastAPI initializes the app instance (`app = FastAPI(...)`) and attaches the router from `app/routes/files.py`.

---

## 2. Request Routing Execution Flow

When a client sends a request (e.g. `POST /api/files/`):

1. **ASGI Server (Uvicorn)** receives the HTTP request and routes it to FastAPI.
2. **FastAPI Router (`app/routes/files.py`)** matches the request path `/api/files/` and HTTP method `POST` to the `upload_file()` function.
3. **Dependency Injection (`Depends(get_db)`)**:
   - FastAPI invokes `get_db()` from `app/database.py`.
   - `get_db()` yields a fresh SQLAlchemy database session (`db`).
   - After the route function finishes executing, `get_db()` automatically executes its `finally` block to close the database connection.

---

## 3. Step-by-Step File Processing Lifecycle

When a file is uploaded to `POST /api/files/`:

```text
[Upload] ──► [Extension Check] ──► [Save to Disk] ──► [Create DB Record (PROCESSING)]
                                                             │
                                                             ▼
[Return Response] ◄── [Save to DB (COMPLETED)] ◄── [Calculate] ◄── [Transform CRS] ◄── [Read GeoDataFrame]
```

### Step A: File Validation (`app/routes/files.py`)
- `upload_file()` extracts `file.filename` and gets the lowercased extension (`.kml` or `.zip`).
- If the extension is not `.kml` or `.zip`, an HTTP 400 `HTTPException` is raised:
  `{"detail": "Unsupported file type. Only KML and ZIP Shapefiles are allowed."}`

### Step B: Save File & Create Initial Status Record
- A unique UUID string is generated (`file_id = str(uuid.uuid4())`).
- The file is saved to disk inside `uploads/{file_id}_{filename}`.
- A new row is inserted into the `files` database table with `status="PROCESSING"`.

### Step C: Reading Geospatial Data (`app/services/geospatial.py`)
- `read_geospatial_file(file_path, file_extension)` is called:
  - **For KML files**: GeoPandas reads the file via `gpd.read_file(file_path, driver="KML")`.
  - **For ZIP Shapefiles**:
    - The archive is extracted safely into a temporary directory (with Zip-Slip path traversal protection).
    - The code searches for the `.shp` file.
    - GeoPandas loads the `.shp` file into a `GeoDataFrame`.
- If the file is empty or corrupted, a `ValueError` is raised, setting the database status to `FAILED` and returning HTTP 400.

### Step D: CRS Inspection & Reprojection
- `check_and_transform_crs(gdf)` is called:
  - **Missing CRS check**: If `gdf.crs` is `None`, a `ValueError` is raised.
  - **Geographic CRS check**: If `gdf.crs.is_geographic` is `True` (e.g. `EPSG:4326` in degrees), `gdf.estimate_utm_crs()` automatically calculates the appropriate local projected UTM zone (in meters).
  - `gdf.to_crs(...)` reprojects all coordinates from degrees to linear meters.

### Step E: Feature Extraction & Measurement Calculation
- The code iterates through each row of the transformed `GeoDataFrame`:
  - `geometry_type` is identified (`geom.geom_type`: `"Polygon"`, `"LineString"`, `"Point"`, etc.).
  - `calculate_measurement(geom)` is called:
    - **Polygon / MultiPolygon**: calculates `geom.area` in $\text{m}^2$.
    - **LineString / MultiLineString**: calculates `geom.length` in $\text{m}$.
    - **Point / MultiPoint / Unsupported**: returns `None, None`.
  - `extract_feature_properties(row)` cleans attribute properties into a JSON dictionary.
  - A `FeatureModel` record is created for each row.

### Step F: Database Commit & Response
- All `FeatureModel` records are added to the database.
- `db_file.status` is updated to `"COMPLETED"`, `db_file.feature_count` is set to the total feature count, and `db_file.crs` is set to the original CRS string (e.g. `"EPSG:4326"`).
- `db.commit()` saves everything to SQLite.
- FastAPI serializes `db_file` using `FileResponse` Pydantic schema and returns HTTP 201 Created.

---

## 4. GET APIs Execution Flow

### `GET /api/files/{id}/`
1. Route handler queries `FileModel` by primary key `id`.
2. If not found, returns HTTP 404 (`{"detail": "File not found."}`).
3. Returns serialized file status JSON (`FileResponse`).

### `GET /api/files/{id}/measurements/`
1. Route handler verifies `FileModel` exists.
2. Queries all `FeatureModel` records where `file_id == id` ordered by `feature_index`.
3. Returns serialized measurements JSON (`MeasurementsResponse`), where database columns `feature_index` and `measurement_unit` are serialized to JSON fields `"feature_id"` and `"unit"`.

---

## 5. Detailed Function Reference

### 1. `read_geospatial_file`
- **What does it do?**: Opens `.kml` or `.zip` Shapefiles and loads them into a GeoPandas `GeoDataFrame`.
- **Why do we need it?**: Decouples complex file format parsing and zip extraction logic from the route handler.
- **Inputs**: `file_path: str`, `file_extension: str`
- **Output**: `gpd.GeoDataFrame`

---

### 2. `check_and_transform_crs`
- **What does it do?**: Inspects the Coordinate Reference System (CRS) of a GeoDataFrame. If it uses geographic coordinates (degrees), it transforms the dataset to a projected UTM CRS (meters).
- **Why do we need it?**: Spatial measurements (area/length) must be calculated in linear units (meters), not angular degrees.
- **Inputs**: `gdf: gpd.GeoDataFrame`
- **Output**: `Tuple[gpd.GeoDataFrame, str]` (transformed GeoDataFrame, original CRS string)

---

### 3. `calculate_measurement`
- **What does it do?**: Computes area for Polygons, length for LineStrings, and returns `None` for Points and unsupported geometry types.
- **Why do we need it?**: Implements the exact measurement business logic rules required by the project specifications.
- **Inputs**: `geometry: BaseGeometry` (Shapely geometry object)
- **Output**: `Tuple[Optional[float], Optional[str]]` (measurement value, unit string `"m²"` or `"m"`)

---

### 4. `extract_feature_properties`
- **What does it do?**: Extracts attribute columns from a GeoDataFrame row into a clean dictionary, ignoring geometry and converting timestamps to JSON-compatible strings.
- **Why do we need it?**: Ensures database storage and JSON API responses do not fail due to unserializable data types.
- **Inputs**: `row: pd.Series`
- **Output**: `Dict[str, Any]`

---

## 6. How Tests Work

Tests are implemented using **Pytest** and **FastAPI TestClient** in the `tests/` directory:

- **`tests/conftest.py`**:
  - Sets up an isolated test SQLite database.
  - Overrides FastAPI's `get_db` dependency so test requests hit the test database.
  - Defines fixtures (`sample_kml_file`, `sample_shapefile_zip`, `sample_no_crs_zip`, `invalid_zip_file`) that dynamically generate sample geospatial files in temporary test directories.
- **`tests/test_upload.py`**:
  - Tests valid file uploads, invalid file extensions, corrupted ZIP archives, and missing CRS errors.
- **`tests/test_measurements.py`**:
  - Tests spatial measurement calculations (Polygon area, LineString length, Point null handling), CRS reprojection logic, and GET API endpoints.
