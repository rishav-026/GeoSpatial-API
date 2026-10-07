import React, { useState, useRef } from 'react';
import { uploadFile } from '../services/api';
import { Upload, FileUp, AlertCircle, CheckCircle2 } from 'lucide-react';

interface FileUploadProps {
  onUploadStart: () => void;
  onUploadSuccess: (fileId: string) => void;
  onUploadError: (errorMessage: string) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadStart,
  onUploadSuccess,
  onUploadError,
  isLoading,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'kml' && ext !== 'zip') {
      setValidationError('Only KML files or ZIP files containing Shapefiles are supported.');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      } else {
        setSelectedFile(null);
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      } else {
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    onUploadStart();

    try {
      const result = await uploadFile(selectedFile);
      onUploadSuccess(result.id);
    } catch (err: any) {
      onUploadError(err.message || 'Something went wrong while processing the file.');
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
      <h2 className="text-base font-semibold text-slate-100 mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-cyan-400" />
          Upload File
        </span>
        <span className="text-xs text-slate-400 font-mono">.KML / .ZIP (Shapefile)</span>
      </h2>

      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-950/50'
            : selectedFile
            ? 'border-emerald-500/70 bg-emerald-950/20'
            : 'border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-950/90'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".kml,.zip"
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className={`p-3 rounded-full ${selectedFile ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30' : 'bg-slate-800/80 text-slate-400'}`}>
            <FileUp className="w-6 h-6" />
          </div>

          {selectedFile ? (
            <div>
              <p className="font-medium text-slate-200 text-sm flex items-center justify-center gap-1.5 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {(selectedFile.size / 1024).toFixed(1)} KB • Click or drag to replace
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-slate-300">
                Drag & Drop File or <span className="text-cyan-400 hover:underline">Choose File</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supported: <span className="text-slate-300 font-mono">.kml</span>, <span className="text-slate-300 font-mono">.zip</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="mt-3 p-3 bg-rose-950/40 border border-rose-800/50 rounded-lg text-rose-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Submit Button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isLoading || !!validationError}
          className={`px-5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center gap-2 cursor-pointer shadow-md ${
            !selectedFile || isLoading || !!validationError
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-900/40 active:scale-[0.98]'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            'Upload & Process'
          )}
        </button>
      </div>
    </div>
  );
};
