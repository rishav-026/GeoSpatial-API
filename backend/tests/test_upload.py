import os
import pytest
from fastapi import status


def test_valid_kml_upload(client, sample_kml_file):
    """
    Test uploading a valid KML file.
    """
    with open(sample_kml_file, "rb") as f:
        response = client.post(
            "/api/files/",
            files={"file": ("survey.kml", f, "application/vnd.google-earth.kml+xml")}
        )

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "id" in data
    assert data["filename"] == "survey.kml"
    assert data["status"] == "COMPLETED"
    assert data["feature_count"] == 3
    assert data["crs"] is not None


def test_valid_zip_shapefile_upload(client, sample_shapefile_zip):
    """
    Test uploading a valid Shapefile ZIP archive.
    """
    with open(sample_shapefile_zip, "rb") as f:
        response = client.post(
            "/api/files/",
            files={"file": ("survey_shapefile.zip", f, "application/zip")}
        )

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "id" in data
    assert data["filename"] == "survey_shapefile.zip"
    assert data["status"] == "COMPLETED"
    assert data["feature_count"] == 2
    assert "EPSG:4326" in data["crs"]


def test_invalid_file_extension(client):
    """
    Test uploading a file with an unsupported extension (e.g. .txt).
    """
    files = {"file": ("document.txt", b"Dummy text content", "text/plain")}
    response = client.post("/api/files/", files=files)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = response.json()
    assert "Unsupported file type" in data["detail"]


def test_invalid_zip_archive(client, invalid_zip_file):
    """
    Test uploading a ZIP file that does not contain a Shapefile (.shp).
    """
    with open(invalid_zip_file, "rb") as f:
        response = client.post(
            "/api/files/",
            files={"file": ("invalid_archive.zip", f, "application/zip")}
        )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = response.json()
    assert "ZIP archive does not contain a valid Shapefile" in data["detail"]


def test_missing_crs_zip_upload(client, sample_no_crs_zip):
    """
    Test uploading a Shapefile ZIP that is missing CRS information.
    """
    with open(sample_no_crs_zip, "rb") as f:
        response = client.post(
            "/api/files/",
            files={"file": ("no_crs.zip", f, "application/zip")}
        )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = response.json()
    assert "missing Coordinate Reference System" in data["detail"]
