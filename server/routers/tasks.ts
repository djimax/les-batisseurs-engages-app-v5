import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

export const tasksRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number(), status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const projectFilter = input?.projectId ? `AND projectId = ${input.projectId}` : "";
        const statusFilter = input?.status ? `AND status = '${input.status}'` : "";
        
        const result = await (db as any).$client.query(`
          SELECT id, title, description, status, priority, dueDate, assignedTo, progress, createdAt
          FROM tasks
          WHERE 1=1 ${projectFilter} ${statusFilter}
          ORDER BY priority DESC, dueDate ASC
        `);
        return result?.[0] || [];
      } catch (error) {
        console.error("[Tasks] Error listing:", error);
        return [];
      }
    }),

  create: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        dueDate: z.string().optional(),
        assignedTo: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const result = await (db as any).$client.query(`
          INSERT INTO tasks (projectId, title, description, priority, dueDate, assignedTo, status, createdBy)
          VALUES (${input.projectId}, '${input.title}', '${input.description || ""}', 
                  '${input.priority || "medium"}', '${input.dueDate || null}', ${input.assignedTo || null}, 'todo', ${ctx.user?.id || 1})
        `);
        return { success: true, id: result?.[0]?.insertId };
      } catch (error) {
        console.error("[Tasks] Error creating:", error);
        throw error;
      }
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: z.enum(["todo", "in-progress", "review", "done", "blocked"]) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        await (db as any).$client.query(`UPDATE tasks SET status = '${input.status}' WHERE id = ${input.id}`);
        return { success: true };
      } catch (error) {
        console.error("[Tasks] Error updating status:", error);
        throw error;
      }
    }),

  updateProgress: protectedProcedure
    .input(z.object({ id: z.number(), progress: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        await (db as any).$client.query(`UPDATE tasks SET progress = ${input.progress} WHERE id = ${input.id}`);
        return { success: true };
      } catch (error) {
        console.error("[Tasks] Error updating progress:", error);
        throw error;
      }
    }),
});
