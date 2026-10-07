import React, { useState } from 'react';
import type { FeatureMeasurementItem } from '../services/api';
import { Box, GitCommit, MapPin, Info, Code, X } from 'lucide-react';

interface MeasurementTableProps {
  features: FeatureMeasurementItem[];
  isLoading: boolean;
}

export const MeasurementTable: React.FC<MeasurementTableProps> = ({ features, isLoading }) => {
  const [activeGeoJson, setActiveGeoJson] = useState<{ id: number; data: any } | null>(null);

  if (isLoading) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
          <svg className="animate-spin h-6 w-6 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xs font-medium text-slate-400">Extracting feature measurements...</p>
        </div>
      </div>
    );
  }

  // Filter features by geometry type
  const polygonFeatures = features.filter((f) => f.geometry_type.toLowerCase().includes('polygon'));
  const lineFeatures = features.filter((f) => f.geometry_type.toLowerCase().includes('line'));
  const pointFeatures = features.filter((f) => f.geometry_type.toLowerCase().includes('point'));
  const otherFeatures = features.filter(
    (f) =>
      !f.geometry_type.toLowerCase().includes('polygon') &&
      !f.geometry_type.toLowerCase().includes('line') &&
      !f.geometry_type.toLowerCase().includes('point')
  );

  const renderFeatureCard = (feature: FeatureMeasurementItem) => {
    const hasMeasurement = feature.measurement !== null && feature.measurement !== undefined;
    return (
      <div
        key={feature.feature_id}
        className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 hover:border-slate-700 transition-all space-y-2 group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-semibold text-slate-400 group-hover:text-cyan-400 transition-colors">
            ID #{feature.feature_id}
          </span>
          <span className="text-xs font-mono font-semibold text-slate-200">
            {hasMeasurement ? (
              <span className="text-emerald-400">
                {feature.measurement?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                <span className="text-slate-400 font-sans text-[11px]">{feature.unit}</span>
              </span>
            ) : (
              <span className="text-slate-500 italic text-[11px]">Not available</span>
            )}
          </span>
        </div>

        {/* Geometry Label & View Geometry Button */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
          <span>
            Geometry: <strong className="text-slate-200">{feature.geometry_type}</strong>
          </span>
          {feature.geometry && (
            <button
              onClick={() => setActiveGeoJson({ id: feature.feature_id, data: feature.geometry })}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono underline flex items-center gap-1 cursor-pointer"
            >
              <Code className="w-3 h-3" />
              View Geometry
            </button>
          )}
        </div>

        {/* Properties */}
        {feature.properties && Object.keys(feature.properties).length > 0 ? (
          <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-900">
            {Object.entries(feature.properties)
              .filter(([_, v]) => v !== null)
              .slice(0, 3)
              .map(([key, val]) => (
                <span
                  key={key}
                  className="inline-flex items-center text-[10px] bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-slate-300 font-mono truncate max-w-[150px]"
                >
                  <span className="text-slate-400 mr-1">{key}:</span>
                  <span className="text-cyan-300 font-medium">{String(val)}</span>
                </span>
              ))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <span>Features & Measurements</span>
        </h2>
        <span className="text-xs font-mono text-slate-400">
          Total: <span className="text-cyan-400 font-bold">{features.length}</span>
        </span>
      </div>

      {features.length === 0 ? (
        <div className="py-10 text-center bg-slate-950/50 rounded-xl border border-dashed border-slate-800">
          <Info className="w-7 h-7 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400 text-xs font-medium">Upload a geospatial file to view feature measurements.</p>
        </div>
      ) : (
        /* 3 Column Grid matching user wireframe (Polygon | LineString | Point) */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column 1: Polygon */}
          <div className="bg-slate-950/40 border border-purple-900/40 rounded-xl p-3.5 space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-purple-900/30 pb-2.5">
              <span className="text-xs font-bold text-purple-300 tracking-wider flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-purple-400" />
                Polygon
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800/60 rounded-full">
                {polygonFeatures.length}
              </span>
            </div>

            <div className="space-y-2 flex-1 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {polygonFeatures.length > 0 ? (
                polygonFeatures.map(renderFeatureCard)
              ) : (
                <p className="text-[11px] text-slate-600 italic text-center py-4">No Polygon features</p>
              )}
            </div>
          </div>

          {/* Column 2: LineString */}
          <div className="bg-slate-950/40 border border-blue-900/40 rounded-xl p-3.5 space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-blue-900/30 pb-2.5">
              <span className="text-xs font-bold text-blue-300 tracking-wider flex items-center gap-1.5">
                <GitCommit className="w-3.5 h-3.5 text-blue-400" />
                LineString
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800/60 rounded-full">
                {lineFeatures.length}
              </span>
            </div>

            <div className="space-y-2 flex-1 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {lineFeatures.length > 0 ? (
                lineFeatures.map(renderFeatureCard)
              ) : (
                <p className="text-[11px] text-slate-600 italic text-center py-4">No LineString features</p>
              )}
            </div>
          </div>

          {/* Column 3: Point */}
          <div className="bg-slate-950/40 border border-emerald-900/40 rounded-xl p-3.5 space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-emerald-900/30 pb-2.5">
              <span className="text-xs font-bold text-emerald-300 tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Point
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60 rounded-full">
                {pointFeatures.length + otherFeatures.length}
              </span>
            </div>

            <div className="space-y-2 flex-1 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {[...pointFeatures, ...otherFeatures].length > 0 ? (
                [...pointFeatures, ...otherFeatures].map(renderFeatureCard)
              ) : (
                <p className="text-[11px] text-slate-600 italic text-center py-4">No Point features</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Geometry Modal */}
      {activeGeoJson && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-3 relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-mono font-bold text-slate-200 flex items-center gap-2">
                <Code className="w-4 h-4 text-cyan-400" />
                GeoJSON Geometry — Feature ID #{activeGeoJson.id}
              </h3>
              <button
                onClick={() => setActiveGeoJson(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-[350px] overflow-y-auto font-mono text-xs text-cyan-300 scrollbar-thin scrollbar-thumb-slate-800">
              <pre>{JSON.stringify(activeGeoJson.data, null, 2)}</pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveGeoJson(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
