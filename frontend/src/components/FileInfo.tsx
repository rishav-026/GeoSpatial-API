import React from 'react';
import type { FileInfo as FileInfoType } from '../services/api';
import { FileText, Layers, Globe, Activity } from 'lucide-react';

interface FileInfoProps {
  fileInfo: FileInfoType | null;
  isLoading?: boolean;
}

export const FileInfo: React.FC<FileInfoProps> = ({ fileInfo, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-1/4 mb-3"></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="h-12 bg-slate-950/60 rounded-xl"></div>
          <div className="h-12 bg-slate-950/60 rounded-xl"></div>
          <div className="h-12 bg-slate-950/60 rounded-xl"></div>
          <div className="h-12 bg-slate-950/60 rounded-xl"></div>
          <div className="h-12 bg-slate-950/60 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!fileInfo) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/80">
            COMPLETED
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800/80">
            PROCESSING
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950 text-rose-400 border border-rose-800/80">
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Filename */}
        <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <FileText className="w-3 h-3 text-cyan-400" />
            Filename
          </div>
          <p className="text-xs font-mono font-semibold text-slate-100 truncate" title={fileInfo.filename}>
            {fileInfo.filename}
          </p>
        </div>

        {/* Status */}
        <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <Activity className="w-3 h-3 text-cyan-400" />
            Status
          </div>
          <div>{getStatusBadge(fileInfo.status)}</div>
        </div>

        {/* Source CRS */}
        <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <Globe className="w-3 h-3 text-cyan-400" />
            Source CRS
          </div>
          <p className="text-xs font-mono font-semibold text-cyan-300">
            {fileInfo.crs || '—'}
          </p>
        </div>

        {/* Measurement CRS */}
        <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <Globe className="w-3 h-3 text-emerald-400" />
            Measurement CRS
          </div>
          <p className="text-xs font-mono font-semibold text-emerald-400">
            {fileInfo.measurement_crs || '—'}
          </p>
        </div>

        {/* Features */}
        <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <Layers className="w-3 h-3 text-cyan-400" />
            Features
          </div>
          <p className="text-xs font-mono font-semibold text-slate-100">
            {fileInfo.feature_count}
          </p>
        </div>
      </div>
    </div>
  );
};
