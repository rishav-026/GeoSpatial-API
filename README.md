# 🗺️ Geospatial File Measurement API & Frontend

A minimal, production-quality full-stack geospatial application for uploading, processing, and measuring geospatial files.

The application accepts **KML files** and **ZIP archives containing Shapefiles**, extracts their spatial features, handles Coordinate Reference Systems (CRS), calculates measurements for supported geometries (Polygon Area in $\text{m}^2$, LineString Length in $\text{m}$), and presents the results through a simple, modern React dashboard.

The project was designed with a focus on correct geospatial measurement, clean API design, maintainable Python code, and simplicity.

---

## 🎯 Project Objective

The main objective of this project is to build a backend service and matching frontend that can:

1. **Accept** a geospatial file (`.kml` or `.zip` shapefile archive).
2. **Read and extract** its geometric features cleanly.
3. **Identify** geometry types and properties/attributes.
4. **Detect** the source CRS.
5. **Transform** geographic coordinates (`EPSG:4326`) into a suitable projected CRS (`UTM`) when required.
6. **Calculate** measurements:
   - **Polygon / MultiPolygon** $\rightarrow$ **Area** ($\text{m}^2$)
   - **LineString / MultiLineString** $\rightarrow$ **Length** ($\text{m}$)
   - **Point / MultiPoint** $\rightarrow$ **No measurement** (`null`)
7. **Store** file metadata and feature information in an SQLite database.
8. **Expose** the processed information through clean REST APIs.
9. **Provide** a simple frontend dashboard for uploading files and viewing results.

---

## ✨ Features

### 📁 File Support
- **KML (`.kml`)**: Standard XML vector data files.
- **Shapefile ZIP (`.zip`)**: Archives containing `.shp`, `.shx`, `.dbf`, `.prj` spatial data files.

### 🔍 Feature Processing
For every feature inside an uploaded file, the application extracts:
- **Feature ID / Index**
- **Geometry Type** (`Polygon`, `LineString`, `Point`)
- **Geometry** (Standard GeoJSON mapping)
- **CRS** (Source CRS & Measurement CRS)
- **Properties / Attributes** (e.g. `name: Sample Plot`)

### 📐 Measurements Matrix

| Geometry | Calculated Measurement | Unit | Description |
| :--- | :--- | :--- | :--- |
| **Polygon** | Area | `m²` | Calculates surface area in square meters. |
| **MultiPolygon** | Area | `m²` | Calculates combined surface area in square meters. |
| **LineString** | Length | `m` | Calculates linear path distance in meters. |
| **MultiLineString** | Length | `m` | Calculates combined path distance in meters. |
| **Point** | No measurement | `null` | Points have zero area/length. |
| **MultiPoint** | No measurement | `null` | Points have zero area/length. |

---

## 🌍 CRS Handling Strategy

The application:
- **Detects** the source CRS from the dataset header.
- **Handles geographic CRS** such as `EPSG:4326` (Latitude / Longitude in degrees).
- **Estimates** a suitable projected CRS using UTM zone estimation (`estimate_utm_crs()`).
- **Transforms** geometries into linear meters before calculating area or length.
- **Uses existing projected CRS** directly when the input file is already projected.
- **Does NOT silently assume** a CRS when it is missing (returns an HTTP 400 error).

---

## 💻 Frontend Highlights

The React dashboard provides:
- **Drag-and-Drop** file upload zone with extension validation.
- **File Processing Status** (`COMPLETED`, `PROCESSING`, `FAILED`).
- **File Metadata Card**: Displays Filename, Feature Count, **Source CRS** (`EPSG:4326`), and **Measurement CRS** (`EPSG:32643`).
- **3-Column Category View**: Organizes features under **Polygon**, **LineString**, and **Point** columns.
- **GeoJSON Inspector**: Includes a `"View Geometry"` button to inspect raw GeoJSON without requiring heavy map libraries.

---

![Alt Text]([images/my-screenshot.png](https://github.com/rishav-026/GeoSpatial-API/blob/main/Screenshot%202026-10-07%20220008.png))

## 🏗️ Architecture

The application follows a simple, clean client-server architecture:

```text
                    React Frontend
                         │
                         │ HTTP / REST APIs
                         ▼
                  FastAPI Backend
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
        File Processing          Database
        (files.py route)       (SQLite DB)
              │
              ▼
          GeoPandas
              │
        ┌─────┴─────┐
        ▼           ▼
      Shapely     PyProj
        │           │
   Geometry      CRS
   Operations   Transformation
        │           │
        └─────┬─────┘
              ▼
        Measurements (m² / m)
```

---

## 📁 Project Structure

```text
geospatial-api/
│
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app setup, CORS & database creation
│   │   ├── database.py          # SQLite engine connection & SessionLocal provider
│   │   ├── models.py            # FileModel & FeatureModel SQLAlchemy tables
│   │   ├── schemas.py           # Pydantic response models (FileResponse, FeatureMeasurementItem)
│   │   │
│   │   ├── routes/
│   │   │   └── files.py         # REST Endpoints (POST /api/files/, GET /api/files/{id}/)
│   │   │
│   │   └── services/
│   │       └── geospatial.py    # Spatial file parsing, UTM reprojection & Shapely math
│   │
│   ├── tests/                   # Pytest automated test suite (13 passing tests)
│   ├── uploads/                 # Server storage for uploaded files
│   ├── requirements.txt         # Backend Python dependencies
│   └── README.md
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── FileUpload.tsx       # Drag & drop upload with format validation
    │   │   ├── FileInfo.tsx         # File metadata & CRS status card
    │   │   └── MeasurementTable.tsx # 3-column category view + GeoJSON code modal
    │   │
    │   ├── services/
    │   │   └── api.ts               # Type-safe API fetch client functions & interfaces
    │   │
    │   ├── App.tsx                  # Main layout container & state management
    │   ├── main.tsx                 # React DOM entry point
    │   └── index.css                # Global Tailwind CSS styling
    │
    ├── public/                      # Static assets
    ├── .env.example                 # Environment variables template
    ├── package.json                 # Node scripts & dependencies
    └── README.md
```

---

![Alt Text]([[images/my-screenshot.png](https://github.com/rishav-026/GeoSpatial-API/blob/main/Screenshot%202026-10-07%20220008.png)](https://github.com/rishav-026/GeoSpatial-API/blob/main/Screenshot%202026-10-07%20220036.png))

## 🔄 File Processing Flow

When a user uploads a file, the following process takes place:

```text
               User uploads file
                       ↓
              Validate extension (.kml / .zip)
                       ↓
              Save uploaded file to disk
                       ↓
              Create initial database record (PROCESSING)
                       ↓
              Read geospatial data into GeoDataFrame
                       ↓
              Extract individual features & attributes
                       ↓
              Detect source CRS (e.g. EPSG:4326)
                       ↓
              Transform CRS to projected UTM if required (e.g. EPSG:32643)
                       ↓
              Calculate measurements (Area in m² / Length in m)
                       ↓
              Store feature information & GeoJSON in database
                       ↓
              Mark file status as COMPLETED
                       ↓
              Return response to frontend client
```

---

## 📄 KML Processing

For a KML file:

```text
survey.kml ──► GeoPandas (Fiona Driver) ──► GeoDataFrame ──► Features (Geometry + Properties + CRS)
```

- GeoPandas is responsible for reading the geospatial XML data and representing it as a `GeoDataFrame`.
- Each row in the `GeoDataFrame` represents one feature with its geometry and properties.

---

## 🗜️ Shapefile ZIP Processing

A Shapefile is made up of multiple related component files:
- `.shp` — Feature geometry shapes.
- `.shx` — Shape index format.
- `.dbf` — Attribute properties in dBase format.
- `.prj` — Projection and Coordinate Reference System description.

Therefore, the API accepts a `.zip` archive containing these files.

```text
survey.zip ──► Safely Extract ZIP ──► Locate .shp file ──► GeoPandas Reads Shapefile ──► GeoDataFrame
```

The application validates the ZIP contents and protects against Zip-Slip security vulnerabilities instead of assuming every ZIP file is valid.

---

## 📐 Measurement Calculation Engine

Measurements are calculated based on geometry type after reprojecting to a linear projected CRS.

### Polygon / MultiPolygon
For polygons:
```python
area = geometry.area
```
The result is returned in square meters (**$\text{m}^2$**).

### LineString / MultiLineString
For LineStrings:
```python
length = geometry.length
```
The result is returned in meters (**$\text{m}$**).

### Point / MultiPoint
Points do not have an area or length measurement. Therefore:
```json
{
  "measurement": null,
  "unit": null
}
```

### Unsupported Geometries
Unsupported geometries (such as `GeometryCollection`) do not cause the file-processing operation to fail. Instead, the feature is returned with `measurement: null`. This allows other valid features in the same file to be processed successfully.

---

## 🌍 CRS Handling Deep-Dive

### Why CRS Matters
A file using `EPSG:4326` stores coordinates as **latitude / longitude in angular degrees**.

Directly calculating `geometry.area` or `geometry.length` on `EPSG:4326` coordinates produces meaningless angular values (such as $0.000042$ square degrees) rather than meters or square meters.

### CRS Transformation Strategy
1. The application inspects the **Source CRS** (e.g. `EPSG:4326`).
2. The application estimates a suitable projected **Measurement CRS** using `gdf.estimate_utm_crs()` (e.g. `EPSG:32643` for the sample Bengaluru dataset).
3. Transformation pipeline:
   ```text
   Source CRS (EPSG:4326) ──► Transform ──► Measurement CRS (EPSG:32643) ──► Calculate Area (m²) & Length (m)
   ```
4. **If the input is already projected**: The existing projected CRS is used directly without unnecessary re-transformation.
5. **If CRS is missing**: The application rejects the file with an HTTP 400 error rather than silently assuming a default CRS.

---

## 📡 Complete API Reference

### 1. Upload File
- **Endpoint**: `POST /api/files/`
- **Content-Type**: `multipart/form-data`
- **Parameters**: `file` (`.kml` or `.zip` shapefile archive)

#### cURL Request:
```bash
curl -X POST "http://127.0.0.1:8000/api/files/" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@survey.kml"
```

#### Response (`201 Created`):
```json
{
  "id": "a29e4198-194b-4fd5-8183-e8c11f007b33",
  "filename": "survey.kml",
  "feature_count": 3,
  "crs": "EPSG:4326",
  "measurement_crs": "EPSG:32643",
  "status": "COMPLETED"
}
```

---

### 2. File Information
- **Endpoint**: `GET /api/files/{id}/`

#### Response (`200 OK`):
```json
{
  "id": "a29e4198-194b-4fd5-8183-e8c11f007b33",
  "filename": "survey.kml",
  "feature_count": 3,
  "crs": "EPSG:4326",
  "measurement_crs": "EPSG:32643",
  "status": "COMPLETED"
}
```

---

### 3. Measurements & Feature Geometries
- **Endpoint**: `GET /api/files/{id}/measurements/`

#### Response (`200 OK`):
```json
{
  "file_id": "a29e4198-194b-4fd5-8183-e8c11f007b33",
  "features": [
    {
      "feature_id": 0,
      "geometry_type": "Polygon",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [77.5945, 12.9716, 0.0],
            [77.5945, 12.9720, 0.0],
            [77.5955, 12.9720, 0.0],
            [77.5955, 12.9716, 0.0],
            [77.5945, 12.9716, 0.0]
          ]
        ]
      },
      "measurement": 48067.92,
      "unit": "m²",
      "properties": {
        "Name": "Sample Plot"
      }
    },
    {
      "feature_id": 1,
      "geometry_type": "LineString",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [77.5945, 12.9716, 0.0],
          [77.5955, 12.9720, 0.0]
        ]
      },
      "measurement": 553.80,
      "unit": "m",
      "properties": {
        "Name": "Sample Road"
      }
    },
    {
      "feature_id": 2,
      "geometry_type": "Point",
      "geometry": {
        "type": "Point",
        "coordinates": [77.5945, 12.9716, 0.0]
      },
      "measurement": null,
      "unit": null,
      "properties": {
        "Name": "Sample Location"
      }
    }
  ]
}
```

---

## 🚀 Quick Start & Local Setup

### 1. Run the FastAPI Backend
```bash
# Navigate to the backend directory
cd backend

# Create & activate virtual environment (Windows)
python -m venv ..\venv
..\venv\Scripts\activate

# Install Python requirements
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Backend API will run at `http://127.0.0.1:8000`.

---

### 2. Run the React Frontend
```bash
# In a new terminal, navigate to frontend
cd frontend

# Install Node dependencies
npm install

# Copy environment variable template
cp .env.example .env

# Start dev server
npm run dev
```
Frontend Dashboard will run at `http://localhost:5173`.

---

## 🧪 Running Tests

Run the backend test suite from the `backend/` directory:

```bash
cd backend
..\venv\Scripts\python -m pytest
```

All **13 automated tests** pass cleanly, testing file upload validation, CRS transformation, Polygon area, LineString length, Point measurement null handling, and API serialization.

---

## 📚 Learnings & Future Scope

### Key Learnings
1. **Geospatial Projections**: Understanding cartographic transformations and why linear UTM coordinate projections are necessary for accurate planar metric math.
2. **Shapefile Archive Handling**: Managing multi-file Shapefiles (`.shp`, `.shx`, `.dbf`, `.prj`) archived inside `.zip` files.
3. **Fiona Drivers & GeoPandas**: Reading KML files using GeoPandas driver support.

### Future Scope
- **Asynchronous Task Queues**: Integrate Celery and Redis to process large shapefiles asynchronously.
- **PostGIS Database Integration**: Store spatial geometries in PostgreSQL with PostGIS extensions.
- **Cloud Object Storage**: Save raw uploaded archives to Amazon S3.
- **Interactive Map Canvas**: Embed an interactive satellite map canvas to highlight selected geometries.
