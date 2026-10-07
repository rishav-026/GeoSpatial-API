# Geospatial Analyzer - Minimal React Frontend

A clean, modern React + Vite + TypeScript visual dashboard for interacting with the **Geospatial File Measurement API**.

## 🛠️ Technology Stack

- **React 19**
- **Vite**
- **TypeScript**
- **Tailwind CSS v4**
- **Lucide React** (Icons)

## 🚀 Quick Start & Running Locally

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Ensure `VITE_API_URL` points to your running FastAPI backend:

```env
VITE_API_URL=http://localhost:8000
```

### 3. Start Development Server

```bash
npm run dev
```

The frontend will run at: `http://localhost:5173`

---

## 📡 API Communication & CORS

The React frontend communicates with the FastAPI backend via standard `fetch` requests defined in `src/services/api.ts`:

- `POST /api/files/`: Upload KML or Shapefile ZIP archive via `multipart/form-data`.
- `GET /api/files/{id}/`: Retrieve file job status and spatial metadata.
- `GET /api/files/{id}/measurements/`: Retrieve spatial measurements and property attributes.

### CORS Configuration

Because the frontend (`http://localhost:5173`) and backend (`http://localhost:8000`) run on different origins during local development, Cross-Origin Resource Sharing (CORS) is enabled in FastAPI (`app/main.py`):

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

## 📁 Component Structure

```text
src/
├── components/
│   ├── FileUpload.tsx       # Handles drag & drop, file validation (.kml, .zip), and POST upload
│   ├── FileInfo.tsx         # Displays filename, job status, CRS, and feature count
│   └── MeasurementTable.tsx # Renders spatial measurements, geometry badges, and attributes
│
├── services/
│   └── api.ts               # API fetch helper functions and TypeScript interfaces
│
├── App.tsx                  # Main state management and application container
├── main.tsx                 # Application entry point
└── index.css                # Global Tailwind CSS styles
```
