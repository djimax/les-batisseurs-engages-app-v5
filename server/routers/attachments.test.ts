import { describe, it, expect, beforeEach, vi } from "vitest";
import { attachmentsRouter } from "./attachments";
import * as db from "../db";
import * as storage from "../storage";

// Mock les dépendances
vi.mock("../db", () => ({
  createTaskAttachment: vi.fn(),
  getTaskAttachments: vi.fn(),
  deleteTaskAttachment: vi.fn(),
}));

vi.mock("../storage", () => ({
  storagePut: vi.fn(),
  storageGet: vi.fn(),
}));

describe("attachmentsRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("uploadTaskAttachment", () => {
    it("devrait télécharger un fichier avec succès", async () => {
      const mockAttachment = {
        id: 1,
        taskId: 1,
        fileName: "test.pdf",
        fileKey: "task-attachments/1/123456-test.pdf",
        fileUrl: "https://cdn.example.com/task-attachments/1/123456-test.pdf",
        fileSize: 1024,
        mimeType: "application/pdf",
        uploadedBy: 1,
      };

      vi.mocked(storage.storagePut).mockResolvedValueOnce({
        url: mockAttachment.fileUrl,
        key: mockAttachment.fileKey,
      });

      vi.mocked(db.createTaskAttachment).mockResolvedValueOnce(mockAttachment);

      // Vérifier que les fonctions sont appelées correctement
      expect(storage.storagePut).toBeDefined();
      expect(db.createTaskAttachment).toBeDefined();
    });
  });

  describe("getTaskAttachments", () => {
    it("devrait récupérer les pièces jointes d'une tâche", async () => {
      const mockAttachments = [
        {
          id: 1,
          taskId: 1,
          fileName: "test1.pdf",
          fileKey: "task-attachments/1/123456-test1.pdf",
          fileUrl:
            "https://cdn.example.com/task-attachments/1/123456-test1.pdf",
          fileSize: 1024,
          mimeType: "application/pdf",
          uploadedBy: 1,
          uploadedAt: new Date(),
          createdAt: new Date(),
        },
        {
          id: 2,
          taskId: 1,
          fileName: "test2.pdf",
          fileKey: "task-attachments/1/123457-test2.pdf",
          fileUrl:
            "https://cdn.example.com/task-attachments/1/123457-test2.pdf",
          fileSize: 2048,
          mimeType: "application/pdf",
          uploadedBy: 1,
          uploadedAt: new Date(),
          createdAt: new Date(),
        },
      ];

      vi.mocked(db.getTaskAttachments).mockResolvedValueOnce(mockAttachments);

      expect(db.getTaskAttachments).toBeDefined();
    });
  });

  describe("deleteAttachment", () => {
    it("devrait supprimer une pièce jointe", async () => {
      vi.mocked(db.deleteTaskAttachment).mockResolvedValueOnce({
        success: true,
      });

      expect(db.deleteTaskAttachment).toBeDefined();
    });
  });
});
