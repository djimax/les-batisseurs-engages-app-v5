import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { projects, tasks } from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

const projectSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  status: z.enum(["planning", "in-progress", "on-hold", "completed", "cancelled"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.string().optional(),
  spent: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
});

const taskSchema = z.object({
  projectId: z.number().positive(),
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  status: z.enum(["todo", "in-progress", "review", "done", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignedTo: z.number().optional(),
  dueDate: z.string().optional(),
});



export const projectsRouter = router({
  // List all projects
  list: publicProcedure
    .input(z.object({
      status: z.string().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      let query = db.select().from(projects);

      if (input?.status) {
        return await query.where(eq(projects.status, input.status as any));
      }
      
      return await query;
    }),

  // Get project by ID
  getById: publicProcedure
    .input(z.number().positive())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const result = await db
        .select()
        .from(projects)
        .where(eq(projects.id, input));
      return result[0] || null;
    }),

  // Create project
  create: protectedProcedure
    .input(projectSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const result = await db.insert(projects).values({
        ...input,
        createdBy: ctx.user.id,
        startDate: input.startDate ? new Date(input.startDate) : new Date(),
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      });
      return result;
    }),

  // Update project
  update: protectedProcedure
    .input(z.object({
      id: z.number().positive(),
      ...projectSchema.shape,
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const { id, ...data } = input;
      return db
        .update(projects)
        .set({
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
        })
        .where(eq(projects.id, id));
    }),

  // Delete project
  delete: protectedProcedure
    .input(z.number().positive())
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      return db.delete(projects).where(eq(projects.id, input));
    }),

  // Get project tasks
  getTasks: publicProcedure
    .input(z.number().positive())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, input));
    }),

  // Create task
  createTask: protectedProcedure
    .input(taskSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      return db.insert(tasks).values({
        ...input,
        createdBy: ctx.user.id,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      });
    }),

  // Update task
  updateTask: protectedProcedure
    .input(z.object({
      id: z.number().positive(),
      ...taskSchema.shape,
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const { id, ...data } = input;
      // Remove projectId from update data since it's the primary key
      const { projectId, ...updateData } = data;
      return db
        .update(tasks)
        .set({
          ...updateData,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        })
        .where(eq(tasks.id, id));
    }),

  // Delete task
  deleteTask: protectedProcedure
    .input(z.number().positive())
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      return db.delete(tasks).where(eq(tasks.id, input));
    }),

});
