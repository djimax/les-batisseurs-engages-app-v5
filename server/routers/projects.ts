import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

export const projectsRouter = router({
  list: protectedProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const statusFilter = input?.status ? `AND status = '${input.status}'` : "";
        const result = await (db as any).$client.query(`
          SELECT id, name, description, startDate, endDate, budget, status, progress, priority, createdAt
          FROM projects
          WHERE 1=1 ${statusFilter}
          ORDER BY startDate DESC
        `);
        return result?.[0] || [];
      } catch (error) {
        console.error("[Projects] Error listing:", error);
        return [];
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        const result = await (db as any).$client.query(`SELECT * FROM projects WHERE id = ${input.id}`);
        if (!result?.[0] || result[0].length === 0) return null;

        const tasks = await (db as any).$client.query(`
          SELECT id, title, status, priority, dueDate, assignedTo, progress
          FROM tasks
          WHERE projectId = ${input.id}
          ORDER BY priority DESC, dueDate ASC
        `);

        return { ...result[0][0], tasks: tasks?.[0] || [] };
      } catch (error) {
        console.error("[Projects] Error getting by ID:", error);
        return null;
      }
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        startDate: z.string(),
        endDate: z.string().optional(),
        budget: z.number().optional(),
        priority: z.enum(["low", "medium", "high", "critical"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const result = await (db as any).$client.query(`
          INSERT INTO projects (name, description, startDate, endDate, budget, priority, status, createdBy)
          VALUES ('${input.name}', '${input.description || ""}', '${input.startDate}', 
                  '${input.endDate || null}', ${input.budget || null}, '${input.priority || "medium"}', 'planning', ${ctx.user?.id || 1})
        `);
        return { success: true, id: result?.[0]?.insertId };
      } catch (error) {
        console.error("[Projects] Error creating:", error);
        throw error;
      }
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: z.enum(["planning", "active", "on-hold", "completed", "cancelled"]) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        await (db as any).$client.query(`UPDATE projects SET status = '${input.status}' WHERE id = ${input.id}`);
        return { success: true };
      } catch (error) {
        console.error("[Projects] Error updating status:", error);
        throw error;
      }
    }),
});
