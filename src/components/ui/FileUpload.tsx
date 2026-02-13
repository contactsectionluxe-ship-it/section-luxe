'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileUploadProps {
  label?: string;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  onFilesChange: (files: File[]) => void;
  error?: string;
  helperText?: string;
  preview?: boolean;
}

export function FileUpload({
  label,
  accept = { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
  maxFiles = 1,
  maxSize = MAX_FILE_SIZE_BYTES,
  onFilesChange,
  error,
  helperText,
  preview = true,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles);
      setFiles(newFiles);
      onFilesChange(newFiles);

      if (preview) {
        const newPreviews = newFiles.map((file) => {
          if (file.type.startsWith('image/')) {
            return URL.createObjectURL(file);
          }
          return '';
        });
        setPreviews(newPreviews);
      }
    },
    [files, maxFiles, onFilesChange, preview]
  );

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesChange(newFiles);

    if (preview && previews[index]) {
      URL.revokeObjectURL(previews[index]);
      setPreviews(previews.filter((_, i) => i !== index));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: maxFiles - files.length,
    maxSize,
    disabled: files.length >= maxFiles,
  });

  const isImage = accept['image/*'] !== undefined;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
          {label}
        </label>
      )}

      {/* Dropzone */}
      {files.length < maxFiles && (
        <div
          {...getRootProps()}
          className={cn(
            'border border-dashed border-[#e8e8e8] p-10 min-h-[140px] flex items-center justify-center text-center cursor-pointer transition-colors',
            isDragActive && 'border-[#1a1a1a] bg-[#fafafa]',
            error && 'border-red-500',
            files.length >= maxFiles && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-[#999]" />
            <p className="text-sm text-[#666]">
              {isDragActive
                ? 'Déposez ici'
                : 'Glissez-déposez ou cliquez pour sélectionner'}
            </p>
            <p className="text-xs text-[#999]">
              {maxFiles > 1 ? `Maximum ${maxFiles} fichiers` : '1 fichier maximum'} - {Math.round(maxSize / 1024 / 1024)}Mo max
            </p>
          </div>
        </div>
      )}

      {/* Files list */}
      {files.length > 0 && (
        <div className={cn('grid gap-3', files.length < maxFiles && 'mt-4', maxFiles > 1 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1')}>
          {files.map((file, index) => (
            <div
              key={index}
              className="relative group border border-[#e8e8e8] bg-[#fafafa]"
            >
              {preview && isImage && previews[index] ? (
                <div className="aspect-square">
                  <img
                    src={previews[index]}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square flex items-center justify-center">
                  {isImage ? (
                    <Image className="h-8 w-8 text-[#999]" />
                  ) : (
                    <File className="h-8 w-8 text-[#999]" />
                  )}
                </div>
              )}

              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-2 right-2 p-1 bg-white border border-[#e8e8e8] text-[#666] hover:text-[#1a1a1a] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              {/* File name */}
              <div className="absolute bottom-0 left-0 right-0 bg-white/90 px-2 py-1">
                <p className="text-xs text-[#666] truncate">{file.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-xs text-[#999]">{helperText}</p>
      )}
    </div>
  );
}
