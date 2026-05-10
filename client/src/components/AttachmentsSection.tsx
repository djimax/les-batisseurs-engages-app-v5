import React, { useState, useEffect } from "react";
import { Download, Trash2, FileIcon, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileUploader } from "./FileUploader";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AttachmentsSectionProps {
  taskId: number;
}

export function AttachmentsSection({ taskId }: AttachmentsSectionProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const utils = trpc.useUtils();
  const { data: attachments, isLoading } =
    trpc.attachments.getTaskAttachments.useQuery({
      taskId,
    });

  const uploadMutation = trpc.attachments.uploadTaskAttachment.useMutation({
    onSuccess: () => {
      toast.success("Fichier téléchargé avec succès");
      setSelectedFiles([]);
      setIsUploadOpen(false);
      utils.attachments.getTaskAttachments.invalidate({ taskId });
    },
    onError: error => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = trpc.attachments.deleteAttachment.useMutation({
    onSuccess: () => {
      toast.success("Fichier supprimé");
      utils.attachments.getTaskAttachments.invalidate({ taskId });
    },
    onError: error => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of selectedFiles) {
        const buffer = await file.arrayBuffer();
        await uploadMutation.mutateAsync({
          taskId,
          fileName: file.name,
          fileData: Buffer.from(buffer),
          mimeType: file.type,
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (date: Date | string | null): string => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      {isUploadOpen && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            Ajouter des pièces jointes
          </h3>
          <FileUploader
            onFilesSelected={setSelectedFiles}
            maxSize={10}
            disabled={isUploading}
            isLoading={isUploading}
          />
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isUploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Téléchargement...
                </>
              ) : (
                "Télécharger"
              )}
            </Button>
            <Button
              onClick={() => {
                setIsUploadOpen(false);
                setSelectedFiles([]);
              }}
              variant="outline"
              disabled={isUploading}
            >
              Annuler
            </Button>
          </div>
        </Card>
      )}

      {/* Add Button */}
      {!isUploadOpen && (
        <Button
          onClick={() => setIsUploadOpen(true)}
          variant="outline"
          className="w-full"
        >
          + Ajouter une pièce jointe
        </Button>
      )}

      {/* Attachments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : attachments && attachments.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">
            Pièces jointes ({attachments.length})
          </h3>
          {attachments.map(attachment => (
            <Card key={attachment.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <a
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 truncate block"
                    >
                      {attachment.fileName}
                    </a>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(attachment.fileSize)} •{" "}
                      {formatDate(attachment.uploadedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 ml-2 flex-shrink-0">
                  <a
                    href={attachment.fileUrl}
                    download={attachment.fileName}
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                    title="Télécharger"
                  >
                    <Download className="h-4 w-4 text-gray-600" />
                  </a>
                  <button
                    onClick={() => deleteMutation.mutate({ id: attachment.id })}
                    disabled={deleteMutation.isPending}
                    className="p-2 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-500">Aucune pièce jointe</p>
        </Card>
      )}
    </div>
  );
}
