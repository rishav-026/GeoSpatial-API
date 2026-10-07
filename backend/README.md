# Geospatial File Measurement API - Backend

A minimal, interview-friendly backend REST service built with **Python 3.11+**, **FastAPI**, **GeoPandas**, and **SQLAlchemy (SQLite)**.

## 🛠️ Quick Start

### 1. Setup Virtual Environment

```powershell
python -m venv venv
.\venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run Backend Server

```bash
uvicorn app.main:app --reload --port 8000
```

The backend server will run at `http://localhost:8000`.

### 4. Run Tests

```bash
pytest
```
