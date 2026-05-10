import React, { useRef, useState } from "react";
import { Upload, X, File, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  disabled?: boolean;
  isLoading?: boolean;
}

export function FileUploader({
  onFilesSelected,
  maxSize = 10,
  acceptedTypes = ["*"],
  disabled = false,
  isLoading = false,
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const validateFiles = (
    files: File[]
  ): { valid: File[]; errors: string[] } => {
    const validFiles: File[] = [];
    const newErrors: string[] = [];

    files.forEach(file => {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        newErrors.push(`${file.name} dépasse la taille limite de ${maxSize}MB`);
        return;
      }

      // Check file type
      if (acceptedTypes.length > 0 && !acceptedTypes.includes("*")) {
        const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
        const mimeType = file.type;
        const isAccepted = acceptedTypes.some(
          type =>
            type === mimeType ||
            type === `.${fileExtension}` ||
            type === fileExtension
        );

        if (!isAccepted) {
          newErrors.push(`${file.name} n'est pas un type de fichier accepté`);
          return;
        }
      }

      validFiles.push(file);
    });

    return { valid: validFiles, errors: newErrors };
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    const { valid, errors: newErrors } = validateFiles(files);

    if (newErrors.length > 0) {
      setErrors(newErrors);
    }

    if (valid.length > 0) {
      setErrors([]);
      setSelectedFiles(prev => [...prev, ...valid]);
      onFilesSelected([...selectedFiles, ...valid]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleClick = () => {
    if (!disabled && !isLoading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Drag and Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50"
        } ${disabled || isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleChange}
          className="hidden"
          disabled={disabled || isLoading}
          accept={
            acceptedTypes.includes("*") ? undefined : acceptedTypes.join(",")
          }
        />

        <div
          onClick={handleClick}
          className="flex flex-col items-center justify-center py-8 px-4"
        >
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm font-medium text-gray-700">
            Glissez-déposez vos fichiers ici
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ou cliquez pour sélectionner
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Taille maximale: {maxSize}MB
          </p>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Card className="bg-red-50 border-red-200 p-4">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Erreurs de validation
              </p>
              <ul className="mt-2 space-y-1">
                {errors.map((error, idx) => (
                  <li key={idx} className="text-xs text-red-700">
                    • {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Fichiers sélectionnés ({selectedFiles.length})
          </h3>
          <div className="space-y-2">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <File className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)}MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(idx)}
                  disabled={isLoading}
                  className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                  aria-label="Supprimer le fichier"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="space-y-2">
            <p className="text-sm font-medium text-blue-900">
              Téléchargement en cours...
            </p>
            <Progress value={33} className="h-2" />
          </div>
        </Card>
      )}
    </div>
  );
}
