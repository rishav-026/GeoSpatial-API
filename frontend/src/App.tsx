import { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { FileInfo } from './components/FileInfo';
import { MeasurementTable } from './components/MeasurementTable';
import { getFileInfo, getMeasurements } from './services/api';
import type { FileInfo as FileInfoType, FeatureMeasurementItem } from './services/api';
import { Compass, AlertCircle, RefreshCw, Layers, ShieldCheck, Activity } from 'lucide-react';

export default function App() {
  const [fileId, setFileId] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfoType | null>(null);
  const [measurements, setMeasurements] = useState<FeatureMeasurementItem[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleUploadStart = () => {
    setIsUploading(true);
    setError(null);
  };

  const handleUploadSuccess = async (id: string) => {
    setFileId(id);
    setIsUploading(false);
    setIsLoadingData(true);
    setError(null);

    try {
      const [infoData, measurementsData] = await Promise.all([
        getFileInfo(id),
        getMeasurements(id),
      ]);

      setFileInfo(infoData);
      setMeasurements(measurementsData.features || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch file details or measurements.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleUploadError = (errorMessage: string) => {
    setIsUploading(false);
    setError(errorMessage);
  };

  const handleReset = () => {
    setFileId(null);
    setFileInfo(null);
    setMeasurements([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Navigation Header */}
      <header className="bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3.5 sm:px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-cyan-950">
              <Compass className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-100 flex items-center gap-2">
                GEOSPATIAL ANALYZER
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  PRO
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-mono">File Measurement Engine • KML & Shapefile ZIP</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {fileId && (
              <button
                onClick={handleReset}
                className="text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition flex items-center gap-1.5 cursor-pointer font-mono"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                New File
              </button>
            )}
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Backend Online
            </div>
          </div>
        </div>
      </header>

      {/* Main Container - Split View (Left: Hero Image | Right: Upload & 3 Columns) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-rose-950/40 border border-rose-800/60 text-rose-200 rounded-xl p-4 flex items-start space-x-3 shadow-lg backdrop-blur-md">
            <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
            <div className="flex-1 text-xs">
              <h3 className="font-semibold text-rose-300 font-mono uppercase tracking-wider">Processing Error</h3>
              <p className="mt-0.5 text-rose-400">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Hero Image Container */}
          <div className="lg:col-span-5 h-full">
            <div className="relative bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl group flex flex-col justify-between min-h-[500px] lg:h-full">
              {/* Artwork Image */}
              <img
                src="/geospatial_hero.jpg"
                alt="Geospatial Analysis Artwork"
                className="absolute inset-0 w-full h-full object-cover object-center opacity-85 group-hover:scale-105 transition-transform duration-700 ease-out"
              />

              {/* Gradient Dark Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/60 pointer-events-none"></div>

              {/* HUD Header overlay */}
              <div className="relative p-5 z-10 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase bg-slate-950/80 px-2.5 py-1 rounded-md border border-cyan-900/60 backdrop-blur-md">
                  3D TERRAIN MODEL
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800 backdrop-blur-md flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-emerald-400" /> RADAR TRACK
                </span>
              </div>

              {/* HUD Footer overlay */}
              <div className="relative p-5 z-10 mt-auto space-y-3">
                <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" /> CRS Engine
                    </span>
                    <span className="text-cyan-300 font-bold">Projected Measurement</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono pt-1">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Source CRS
                    </span>
                    <span className="text-cyan-300 font-bold">{fileInfo?.crs || 'EPSG:4326'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Measurement CRS
                    </span>
                    <span className="text-emerald-400 font-bold">{fileInfo?.measurement_crs || 'EPSG:32643'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 font-sans leading-relaxed">
                    Transforms geographic coordinates into a suitable projected CRS for area and length measurements.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Top Upload Box + Bottom 3 Geometry Columns */}
          <div className="lg:col-span-7 space-y-6">
            {/* Top Box: Upload File Component */}
            <FileUpload
              onUploadStart={handleUploadStart}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              isLoading={isUploading}
            />

            {/* File Info Card (If file uploaded) */}
            {fileInfo && <FileInfo fileInfo={fileInfo} isLoading={isLoadingData} />}

            {/* Bottom Box: 3 Geometry Columns (Polygon | LineString | Point) */}
            <MeasurementTable features={measurements} isLoading={isLoadingData} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-4 text-center text-xs text-slate-500 font-mono mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          GEOSPATIAL FILE MEASUREMENT DASHBOARD • REACT + VITE + TAILWIND CSS
        </div>
      </footer>
    </div>
  );
}
