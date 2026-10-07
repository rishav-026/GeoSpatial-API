import os
import zipfile
import tempfile
from typing import Dict, Any, Tuple, Optional
import pandas as pd
import geopandas as gpd
from shapely.geometry.base import BaseGeometry

# Ensure Fiona KML driver support if fiona is used as backend
try:
    import fiona
    if 'KML' not in fiona.drvsupport.supported_drivers:
        fiona.drvsupport.supported_drivers['KML'] = 'rw'
    if 'LIBKML' not in fiona.drvsupport.supported_drivers:
        fiona.drvsupport.supported_drivers['LIBKML'] = 'rw'
except Exception:
    pass


def read_geospatial_file(file_path: str, file_extension: str) -> gpd.GeoDataFrame:
    """
    Reads a geospatial file (.kml or .zip shapefile) into a GeoPandas GeoDataFrame.
    
    Args:
        file_path: Local path to the uploaded file.
        file_extension: Lowercase file extension ('.kml' or '.zip').
        
    Returns:
        GeoPandas GeoDataFrame containing the geospatial features.
        
    Raises:
        ValueError: If file is invalid, empty, or missing required components.
    """
    ext = file_extension.lower()

    if ext == ".kml":
        try:
            gdf = gpd.read_file(file_path, driver="KML")
        except Exception as e:
            # Fallback to driver-autodetect if driver="KML" fails
            try:
                gdf = gpd.read_file(file_path)
            except Exception as inner_e:
                raise ValueError(f"Failed to read KML file: {str(inner_e)}")

    elif ext == ".zip":
        try:
            with tempfile.TemporaryDirectory() as tmp_dir:
                # Extract zip safely preventing Zip Slip vulnerability
                with zipfile.ZipFile(file_path, 'r') as zip_ref:
                    for member in zip_ref.namelist():
                        member_path = os.path.abspath(os.path.join(tmp_dir, member))
                        if not member_path.startswith(os.path.abspath(tmp_dir)):
                            raise ValueError("Unsafe path detected inside ZIP archive.")
                    zip_ref.extractall(tmp_dir)

                # Locate the .shp file inside the extracted files
                shp_files = []
                for root, _, files in os.walk(tmp_dir):
                    for file in files:
                        if file.lower().endswith(".shp"):
                            shp_files.append(os.path.join(root, file))

                if not shp_files:
                    raise ValueError("ZIP archive does not contain a valid Shapefile (.shp file).")

                # Read shapefile using Fiona context manager to ensure file handles are closed before temp directory cleanup
                try:
                    import fiona
                    with fiona.open(shp_files[0]) as src:
                        gdf = gpd.GeoDataFrame.from_features(src, crs=src.crs)
                except Exception:
                    gdf = gpd.read_file(shp_files[0])
        except zipfile.BadZipFile:
            raise ValueError("Uploaded ZIP file is corrupted or not a valid ZIP archive.")
        except ValueError as ve:
            raise ve
        except Exception as e:
            raise ValueError(f"Failed to read Shapefile from ZIP: {str(e)}")
    else:
        raise ValueError("Unsupported file format. Only .kml and .zip Shapefiles are supported.")

    if gdf.empty:
        raise ValueError("Uploaded geospatial file contains no features.")

    return gdf


def check_and_transform_crs(gdf: gpd.GeoDataFrame) -> Tuple[gpd.GeoDataFrame, str, str]:
    """
    Checks the CRS of the GeoDataFrame and transforms geographic CRS (e.g. EPSG:4326)
    to an appropriate projected CRS (e.g. UTM) for accurate distance/area calculations.
    
    Args:
        gdf: Input GeoPandas GeoDataFrame.
        
    Returns:
        Tuple of (transformed_gdf, source_crs_str, measurement_crs_str).
        
    Raises:
        ValueError: If CRS is missing.
    """
    if gdf.crs is None:
        raise ValueError(
            "Geospatial file is missing Coordinate Reference System (CRS) information. "
            "Cannot accurately calculate spatial measurements without a valid CRS."
        )

    # Human-readable representation of original source CRS (e.g. "EPSG:4326")
    source_crs = gdf.crs.to_string()

    # If CRS is geographic (latitude/longitude in degrees), convert to estimated projected UTM CRS (meters)
    if gdf.crs.is_geographic:
        try:
            # Automatically estimate the best local UTM zone projected CRS based on dataset extent
            utm_crs = gdf.estimate_utm_crs()
            if utm_crs is not None:
                measurement_crs = utm_crs.to_string()
                gdf_transformed = gdf.to_crs(utm_crs)
                return gdf_transformed, source_crs, measurement_crs
        except Exception:
            pass
        # Fallback to World Equidistant Cylindrical or Web Mercator if UTM estimation is unavailable
        try:
            gdf_transformed = gdf.to_crs("EPSG:3857")
            return gdf_transformed, source_crs, "EPSG:3857"
        except Exception:
            return gdf, source_crs, source_crs
    else:
        # Already projected CRS (coordinates are already in linear units like meters)
        return gdf, source_crs, source_crs


def calculate_measurement(geometry: BaseGeometry) -> Tuple[Optional[float], Optional[str]]:
    """
    Calculates spatial measurement based on geometry type.
    
    Rules:
      - Polygon / MultiPolygon -> Area in square meters (m²)
      - LineString / MultiLineString -> Length in meters (m)
      - Point / MultiPoint / Unsupported -> None, None
      
    Args:
        geometry: Shapely geometry object.
        
    Returns:
        Tuple of (measurement_val, unit_string)
    """
    if geometry is None or geometry.is_empty:
        return None, None

    geom_type = geometry.geom_type

    if geom_type in ["Polygon", "MultiPolygon"]:
        area_val = round(float(geometry.area), 2)
        return area_val, "m²"
    elif geom_type in ["LineString", "MultiLineString"]:
        length_val = round(float(geometry.length), 2)
        return length_val, "m"
    elif geom_type in ["Point", "MultiPoint"]:
        return None, None
    else:
        # Unsupported geometry types return null gracefully
        return None, None


def extract_feature_properties(row: pd.Series) -> Dict[str, Any]:
    """
    Extracts attributes/properties from a GeoDataFrame row into a clean dictionary.
    Excludes the geometry column and formats timestamps/dates cleanly for JSON serialization.
    """
    properties = {}
    for col, value in row.items():
        if col.lower() == "geometry":
            continue
        if pd.isna(value):
            properties[col] = None
        elif isinstance(value, (pd.Timestamp, pd.Timedelta)):
            properties[col] = str(value)
        else:
            properties[col] = value
    return properties
