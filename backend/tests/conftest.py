import os
import zipfile
import tempfile
import pytest
import geopandas as gpd
from shapely.geometry import Polygon, LineString, Point
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app

# SQLite database URL for testing
TEST_DATABASE_URL = "sqlite:///./test_geospatial.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """
    Creates fresh test database tables at the start of test session and drops them at the end.
    """
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    if os.path.exists("test_geospatial.db"):
        try:
            os.remove("test_geospatial.db")
        except Exception:
            pass


@pytest.fixture
def db():
    """
    Provides a transactional database session for a test function.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db):
    """
    FastAPI TestClient with overridden database dependency.
    """
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_kml_file(tmp_path):
    """
    Creates a temporary valid KML file containing a Polygon, LineString, and Point.
    """
    kml_content = """<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Plot A</name>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              -122.0822,37.4222,0
              -122.0822,37.4220,0
              -122.0810,37.4220,0
              -122.0810,37.4222,0
              -122.0822,37.4222,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
    <Placemark>
      <name>Road A</name>
      <LineString>
        <coordinates>
          -122.0822,37.4222,0
          -122.0820,37.4220,0
        </coordinates>
      </LineString>
    </Placemark>
    <Placemark>
      <name>Location A</name>
      <Point>
        <coordinates>-122.0822,37.4222,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>"""
    kml_file = tmp_path / "survey.kml"
    kml_file.write_text(kml_content, encoding="utf-8")
    return str(kml_file)


@pytest.fixture
def sample_shapefile_zip(tmp_path):
    """
    Creates a temporary valid Shapefile ZIP with EPSG:4326 CRS containing Polygon features.
    (Shapefiles require all features in a single layer to have the same geometry type).
    """
    poly1 = Polygon([(-122.0822, 37.4222), (-122.0822, 37.4220), (-122.0810, 37.4220), (-122.0810, 37.4222), (-122.0822, 37.4222)])
    poly2 = Polygon([(-122.0810, 37.4222), (-122.0810, 37.4220), (-122.0800, 37.4220), (-122.0800, 37.4222), (-122.0810, 37.4222)])

    gdf = gpd.GeoDataFrame(
        {"name": ["Plot A", "Plot B"]},
        geometry=[poly1, poly2],
        crs="EPSG:4326"
    )

    # Save shapefile components to temporary dir
    shp_dir = tmp_path / "shp_export"
    shp_dir.mkdir()
    shp_path = shp_dir / "data.shp"
    gdf.to_file(shp_path, engine="fiona")

    # Compress into a ZIP archive
    zip_path = tmp_path / "survey_shapefile.zip"
    with zipfile.ZipFile(zip_path, "w") as zf:
        for root, _, files in os.walk(shp_dir):
            for file in files:
                full_path = os.path.join(root, file)
                zf.write(full_path, arcname=file)

    return str(zip_path)


@pytest.fixture
def sample_no_crs_zip(tmp_path):
    """
    Creates a temporary Shapefile ZIP that is missing CRS (.prj file).
    """
    poly = Polygon([(0, 0), (0, 10), (10, 10), (10, 0), (0, 0)])
    gdf = gpd.GeoDataFrame({"name": ["Plot No CRS"]}, geometry=[poly], crs=None)

    shp_dir = tmp_path / "no_crs_export"
    shp_dir.mkdir()
    shp_path = shp_dir / "no_crs.shp"
    gdf.to_file(shp_path, engine="fiona")

    # Remove the .prj file if created
    prj_path = shp_dir / "no_crs.prj"
    if prj_path.exists():
        try:
            prj_path.unlink()
        except Exception:
            pass

    zip_path = tmp_path / "no_crs_shapefile.zip"
    with zipfile.ZipFile(zip_path, "w") as zf:
        for file in os.listdir(shp_dir):
            if not file.endswith(".prj"):
                zf.write(shp_dir / file, arcname=file)

    return str(zip_path)


@pytest.fixture
def invalid_zip_file(tmp_path):
    """
    Creates a ZIP file that contains no Shapefile (.shp).
    """
    txt_file = tmp_path / "readme.txt"
    txt_file.write_text("This is not a shapefile.")

    zip_path = tmp_path / "invalid_archive.zip"
    with zipfile.ZipFile(zip_path, "w") as zf:
        zf.write(txt_file, arcname="readme.txt")

    return str(zip_path)
