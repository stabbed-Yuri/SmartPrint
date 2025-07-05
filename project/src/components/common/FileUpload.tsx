import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText } from 'lucide-react';

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
  acceptedTypes?: string[];
}

const FileUpload: React.FC<FileUploadProps> = ({
  files,
  onFilesChange,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  acceptedTypes = ['application/pdf'],
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles);
      onFilesChange(newFiles);
    },
    [files, onFilesChange, maxFiles]
  );

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxSize,
    multiple: true,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : isDragReject
            ? 'border-red-400 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          {isDragActive ? 'Drop files here' : 'Drag & drop PDF files here'}
        </p>
        <p className="text-sm text-gray-500">
          or <span className="text-blue-600 font-medium">browse files</span>
        </p>
        <p className="text-xs text-gray-400 mt-2">
          PDF files only, max {formatFileSize(maxSize)} per file
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Selected Files ({files.length})</h4>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;