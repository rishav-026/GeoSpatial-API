# Geospatial File Measurement API & Frontend

A minimal full-stack geospatial application consisting of a **FastAPI + GeoPandas** backend service and a **React + Vite + TypeScript + Tailwind CSS** frontend dashboard.

The application allows users to upload geospatial files (`.kml` and `.zip` Shapefiles), reprojects coordinates automatically to projected CRS (UTM), calculates geometric measurements (Polygon Area, LineString Length), and displays feature measurements cleanly on an interactive dashboard.

---

## 💻 Service Ports Overview

- **Frontend Dashboard**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000`
- **Interactive API Docs (Swagger)**: `http://localhost:8000/docs`

---

## 📁 Repository Structure

```text
geospatial-api/
│
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app initialization & CORS setup
│   │   ├── database.py          # SQLite & SQLAlchemy session setup
│   │   ├── models.py            # FileModel & FeatureModel ORM classes
│   │   ├── schemas.py           # Pydantic response schemas
│   │   ├── routes/
│   │   │   └── files.py         # File upload & measurement endpoints
│   │   └── services/
│   │       └── geospatial.py    # Spatial processing & measurement engine
│   │
│   ├── tests/                   # Pytest automated test suite
│   ├── uploads/                 # Uploaded files storage
│   ├── requirements.txt         # Python dependencies
│   └── README.md
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── FileUpload.tsx       # Drag & drop upload with format validation
    │   │   ├── FileInfo.tsx         # File metadata & status card
    │   │   └── MeasurementTable.tsx # Feature measurements & attributes table
    │   │
    │   ├── services/
    │   │   └── api.ts               # API fetch client & TypeScript types
    │   │
    │   ├── App.tsx                  # Main page layout & state management
    │   ├── main.tsx                 # React DOM root entry
    │   └── index.css                # Tailwind CSS styling
    │
    ├── .env.example                 # Example frontend environment variables
    ├── package.json                 # Node dependencies & scripts
    └── README.md
```

---

## 🚀 Quick Start Guide

### 1. Start the Backend API

```powershell
# Open terminal inside the project root
cd backend

# Activate Python virtual environment (if using venv)
..\venv\Scripts\activate

# Install Python requirements
pip install -r requirements.txt

# Start FastAPI dev server
uvicorn app.main:app --reload --port 8000
```

The backend API will run at `http://localhost:8000`.

---

### 2. Start the React Frontend

```powershell
# Open a new terminal in the frontend directory
cd frontend

# Install Node dependencies
npm install

# Copy environment template
cp .env.example .env

# Start Vite development server
npm run dev
```

The frontend will run at `http://localhost:5173`.

---

## ⚙️ Environment Variables & Configuration

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8000
```

This ensures the frontend API client (`src/services/api.ts`) communicates dynamically with the FastAPI backend.

---

## 🌐 CORS Configuration

The backend explicitly enables Cross-Origin Resource Sharing (CORS) in `backend/app/main.py` to allow requests from the React frontend running on `http://localhost:5173`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📡 API Reference

### 1. Upload Geospatial File
`POST /api/files/` (`multipart/form-data`)
Accepts `.kml` or `.zip` Shapefile archives.

### 2. Get File Information
`GET /api/files/{id}/`
Returns filename, feature count, CRS, and processing status.

### 3. Get Feature Measurements
`GET /api/files/{id}/measurements/`
Returns feature geometries, calculated measurements (`m²` or `m`), and attribute properties.

---

## 🧪 Running Automated Tests

Run backend tests from the `backend/` directory:

```bash
cd backend
pytest
```
