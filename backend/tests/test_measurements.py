import pytest
import geopandas as gpd
from shapely.geometry import Polygon, LineString, Point, GeometryCollection
from app.services.geospatial import calculate_measurement, check_and_transform_crs
from fastapi import status


def test_calculate_measurement_polygon():
    """
    Test spatial area calculation for Polygon geometry (in projected CRS).
    """
    # 10m x 10m square polygon
    poly = Polygon([(0, 0), (0, 10), (10, 10), (10, 0), (0, 0)])
    measurement, unit = calculate_measurement(poly)
    assert measurement == 100.0
    assert unit == "m²"


def test_calculate_measurement_linestring():
    """
    Test spatial length calculation for LineString geometry (in projected CRS).
    """
    # 25m horizontal line
    line = LineString([(0, 0), (25, 0)])
    measurement, unit = calculate_measurement(line)
    assert measurement == 25.0
    assert unit == "m"


def test_calculate_measurement_point():
    """
    Test spatial measurement handling for Point geometry.
    """
    point = Point(10, 20)
    measurement, unit = calculate_measurement(point)
    assert measurement is None
    assert unit is None


def test_calculate_measurement_unsupported_geometry():
    """
    Test graceful handling for unsupported geometry type (e.g. GeometryCollection).
    """
    collection = GeometryCollection([Point(0, 0), LineString([(0, 0), (1, 1)])])
    measurement, unit = calculate_measurement(collection)
    assert measurement is None
    assert unit is None


def test_crs_transformation_geographic_to_projected():
    """
    Test that geographic CRS (EPSG:4326 in degrees) is automatically transformed
    to a projected CRS (UTM in meters).
    """
    # Create a polygon in San Francisco (latitude/longitude coordinates)
    poly = Polygon([(-122.4194, 37.7749), (-122.4194, 37.7750), (-122.4180, 37.7750), (-122.4180, 37.7749)])
    gdf = gpd.GeoDataFrame({"id": [1]}, geometry=[poly], crs="EPSG:4326")

    assert gdf.crs.is_geographic is True

    transformed_gdf, original_crs, measurement_crs = check_and_transform_crs(gdf)

    assert original_crs == "EPSG:4326"
    assert measurement_crs.startswith("EPSG:")
    assert transformed_gdf.crs.is_projected is True
    # Verify coordinates are in linear units (meters), not degrees
    area = transformed_gdf.geometry.iloc[0].area
    assert area > 1.0  # Area in m² should be significantly larger than fractional degree area (~1e-7)


def test_get_file_info_api(client, sample_kml_file):
    """
    Test GET /api/files/{id}/ endpoint.
    """
    # Upload file first
    with open(sample_kml_file, "rb") as f:
        upload_resp = client.post(
            "/api/files/",
            files={"file": ("survey.kml", f, "application/vnd.google-earth.kml+xml")}
        )
    file_id = upload_resp.json()["id"]

    # Retrieve file metadata
    response = client.get(f"/api/files/{file_id}/")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == file_id
    assert data["filename"] == "survey.kml"
    assert data["status"] == "COMPLETED"
    assert data["feature_count"] == 3
    assert data["crs"] == "EPSG:4326"
    assert "measurement_crs" in data
    assert data["measurement_crs"].startswith("EPSG:")


def test_get_file_measurements_api(client, sample_kml_file):
    """
    Test GET /api/files/{id}/measurements/ endpoint.
    """
    # Upload file first
    with open(sample_kml_file, "rb") as f:
        upload_resp = client.post(
            "/api/files/",
            files={"file": ("survey.kml", f, "application/vnd.google-earth.kml+xml")}
        )
    file_id = upload_resp.json()["id"]

    # Retrieve measurements
    response = client.get(f"/api/files/{file_id}/measurements/")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["file_id"] == file_id
    features = data["features"]
    assert len(features) == 3

    # Feature 0: Polygon
    assert features[0]["geometry_type"] == "Polygon"
    assert features[0]["geometry"] is not None
    assert features[0]["geometry"]["type"] == "Polygon"
    assert features[0]["measurement"] > 0
    assert features[0]["unit"] == "m²"
    assert any(k.lower() == "name" for k in features[0]["properties"])

    # Feature 1: LineString
    assert features[1]["geometry_type"] == "LineString"
    assert features[1]["geometry"] is not None
    assert features[1]["geometry"]["type"] == "LineString"
    assert features[1]["measurement"] > 0
    assert features[1]["unit"] == "m"

    # Feature 2: Point
    assert features[2]["geometry_type"] == "Point"
    assert features[2]["geometry"] is not None
    assert features[2]["geometry"]["type"] == "Point"
    assert features[2]["measurement"] is None
    assert features[2]["unit"] is None


def test_get_nonexistent_file(client):
    """
    Test 404 error when querying a non-existent file ID.
    """
    response = client.get("/api/files/non-existent-id/")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "File not found."

    response_meas = client.get("/api/files/non-existent-id/measurements/")
    assert response_meas.status_code == status.HTTP_404_NOT_FOUND
    assert response_meas.json()["detail"] == "File not found."
