# 🛰️ Geospatial File Measurement API - Backend

A clean, production-ready Python backend REST service built with **FastAPI**, **GeoPandas**, **PyProj**, **Shapely**, and **SQLAlchemy (SQLite)**.

The backend parses geospatial vector files (`.kml` and `.zip` Shapefile archives), reprojects geographic coordinates (`EPSG:4326`) into estimated local projected **UTM** Coordinate Reference Systems (e.g. `EPSG:32643`), calculates planar feature measurements (Polygon Area in $\text{m}^2$, LineString Length in $\text{m}$), and serves results via RESTful endpoints.

---

## 🎯 Core Features & Objectives

1. **Accepts `.kml` and `.zip` Shapefiles** containing `.shp`, `.shx`, `.dbf`, `.prj`.
2. **Extracts features**: Feature ID, Geometry Type, GeoJSON Geometry, Source CRS, Properties.
3. **CRS Reprojection**: Transforms geographic `EPSG:4326` degrees to projected UTM meters before running planar geometric math.
4. **Calculates Measurements**:
   - **Polygon / MultiPolygon** $\rightarrow$ Area ($\text{m}^2$)
   - **LineString / MultiLineString** $\rightarrow$ Length ($\text{m}$)
   - **Point / MultiPoint** $\rightarrow$ `null` (handled gracefully)
5. **SQLite Persistence**: Stores file status (`COMPLETED`, `PROCESSING`, `FAILED`) and feature records in SQLite via SQLAlchemy ORM.

---

## 🏗️ Architecture & Code Layout

```text
backend/
├── app/
│   ├── main.py              # FastAPI application setup & CORS middleware
│   ├── database.py          # SQLAlchemy SQLite connection engine & get_db helper
│   ├── models.py            # FileModel & FeatureModel database tables
│   ├── schemas.py           # Pydantic serialization schemas (FileResponse, FeatureMeasurementItem)
│   ├── routes/
│   │   └── files.py         # HTTP Handlers (POST /api/files/, GET /api/files/{id}/)
│   └── services/
│       └── geospatial.py    # Spatial file parsing, UTM reprojection & Shapely calculations
│
├── tests/                   # Pytest test suite (13 passing tests)
├── uploads/                 # Local directory for uploaded files
└── requirements.txt         # Python package dependencies
```

---

## 🚀 Quick Start

### 1. Activate Virtual Environment & Install Dependencies

```powershell
python -m venv ..\venv
..\venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Run Development Server

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Server runs at `http://127.0.0.1:8000`. Swagger API docs at `http://127.0.0.1:8000/docs`.

### 3. Run Automated Pytest Suite

```bash
..\venv\Scripts\python -m pytest
```

---

## 📡 API Endpoints Summary

- `POST /api/files/` $\rightarrow$ Upload & process `.kml` or `.zip` Shapefile archive.
- `GET /api/files/{id}/` $\rightarrow$ Retrieve file metadata (`crs`, `measurement_crs`, `feature_count`, `status`).
- `GET /api/files/{id}/measurements/` $\rightarrow$ Retrieve feature list with measurements & GeoJSON geometries.
