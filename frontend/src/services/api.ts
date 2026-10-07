const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface FileInfo {
  id: string;
  filename: string;
  feature_count: number;
  crs: string | null;             // Source CRS (e.g. EPSG:4326)
  measurement_crs: string | null; // Measurement CRS (e.g. EPSG:32643)
  status: string;
}

export interface FeatureMeasurementItem {
  feature_id: number;
  geometry_type: string;
  geometry: {
    type: string;
    coordinates: any;
  } | null;
  measurement: number | null;
  unit: string | null;
  properties: Record<string, any>;
}

export interface MeasurementsResponse {
  file_id: string;
  features: FeatureMeasurementItem[];
}

export async function uploadFile(file: File): Promise<FileInfo> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_URL}/api/files/`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Something went wrong while processing the file.';
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail);
        }
      } catch {
        // Fallback
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to backend server. Please check if FastAPI is running.');
    }
    throw error;
  }
}

export async function getFileInfo(id: string): Promise<FileInfo> {
  try {
    const response = await fetch(`${API_URL}/api/files/${id}/`);
    if (!response.ok) {
      let errorMessage = 'Failed to fetch file information.';
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        }
      } catch {
        // Ignore
      }
      throw new Error(errorMessage);
    }
    return await response.json();
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to backend server.');
    }
    throw error;
  }
}

export async function getMeasurements(id: string): Promise<MeasurementsResponse> {
  try {
    const response = await fetch(`${API_URL}/api/files/${id}/measurements/`);
    if (!response.ok) {
      let errorMessage = 'Failed to fetch measurements.';
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        }
      } catch {
        // Ignore
      }
      throw new Error(errorMessage);
    }
    return await response.json();
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to backend server.');
    }
    throw error;
  }
}
