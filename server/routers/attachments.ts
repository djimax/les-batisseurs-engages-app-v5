import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  createTaskAttachment,
  getTaskAttachments,
  deleteTaskAttachment,
} from "../db";
import { storagePut, storageGet } from "../storage";

export const attachmentsRouter = router({
  uploadTaskAttachment: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        fileName: z.string().min(1),
        fileData: z.instanceof(Buffer),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Upload file to S3
        const fileKey = `task-attachments/${ctx.user?.id}/${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(
          fileKey,
          input.fileData,
          input.mimeType
        );

        // Create attachment record
        const attachment = await createTaskAttachment({
          taskId: input.taskId,
          fileName: input.fileName,
          fileKey,
          fileUrl: url,
          fileSize: input.fileData.length,
          mimeType: input.mimeType,
          uploadedBy: ctx.user?.id,
        });

        return attachment;
      } catch (error) {
        console.error("[Attachments] Error uploading:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload attachment",
        });
      }
    }),

  getTaskAttachments: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      try {
        return await getTaskAttachments(input.taskId);
      } catch (error) {
        console.error("[Attachments] Error getting:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get attachments",
        });
      }
    }),

  deleteAttachment: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        return await deleteTaskAttachment(input.id);
      } catch (error) {
        console.error("[Attachments] Error deleting:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete attachment",
        });
      }
    }),

  getDownloadUrl: protectedProcedure
    .input(z.object({ fileKey: z.string() }))
    .query(async ({ input }) => {
      try {
        const result = await storageGet(input.fileKey);
        return { url: result.url };
      } catch (error) {
        console.error("[Attachments] Error getting download URL:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get download URL",
        });
      }
    }),
});
