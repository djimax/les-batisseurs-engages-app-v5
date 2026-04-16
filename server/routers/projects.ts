import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { 
  getAllProjects, 
  getProjectById, 
  createProject, 
  updateProject, 
  deleteProject,
  getTasksByProjectId,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  getProjectExpenses,
  addProjectExpense,
  deleteProjectExpense,
  createTask,
  updateTask,
  deleteTask,
  getTaskById
} from "../db";
import { TRPCError } from "@trpc/server";

export const projectsRouter = router({
  // ============ PROJECTS CRUD ============
  list: protectedProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      try {
        return await getAllProjects({ status: input?.status });
      } catch (error) {
        console.error("[Projects] Error listing:", error);
        return [];
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      try {
        const project = await getProjectById(input.id);
        if (!project) return null;

        const tasks = await getTasksByProjectId(input.id);
        const members = await getProjectMembers(input.id);
        const expenses = await getProjectExpenses(input.id);

        return {
          ...project,
          tasks,
          members,
          expenses,
          statistics: {
            taskCount: tasks.length,
            completedCount: tasks.filter(t => t.status === "done").length,
            totalExpenses: expenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0),
            budgetUsagePercentage: project.budget 
              ? Math.round((expenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) / parseFloat(project.budget.toString())) * 100)
              : 0,
            tasksByStatus: {
              todo: tasks.filter(t => t.status === "todo").length,
            inProgress: tasks.filter(t => t.status === "in-progress").length,
            completed: tasks.filter(t => t.status === "done").length,
            }
          }
        };
      } catch (error) {
        console.error("[Projects] Error getting project:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get project" });
      }
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      status: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      budget: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const project = await createProject({
          title: input.title,
          description: input.description,
          status: (input.status as any) || "planning",
          startDate: input.startDate,
          endDate: input.endDate,
          budget: input.budget ? parseFloat(input.budget).toString() : undefined,
          progress: 0,
          createdBy: ctx.user?.id || 0,
        });
        return project;
      } catch (error) {
        console.error("[Projects] Error creating:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create project" });
      }
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      budget: z.string().optional(),
      progress: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const updated = await updateProject(input.id, {
          title: input.title,
          description: input.description,
          status: (input.status as any) || undefined,
          startDate: input.startDate,
          endDate: input.endDate,
          budget: input.budget ? parseFloat(input.budget).toString() : undefined,
        });
        return updated;
      } catch (error) {
        console.error("[Projects] Error updating:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update project" });
      }
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        return await updateProject(input.id, { status: input.status as any });
      } catch (error) {
        console.error("[Projects] Error updating status:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update project status" });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await deleteProject(input.id);
        return { success: true };
      } catch (error) {
        console.error("[Projects] Error deleting:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete project" });
      }
    }),

  // ============ TASKS CRUD ============
  createTask: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      status: z.string().optional(),
      priority: z.string().optional(),
      dueDate: z.date().optional(),
      assignedTo: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await createTask({
          projectId: input.projectId,
          title: input.title,
          description: input.description,
          status: (input.status as any) || "todo",
          priority: (input.priority as any) || "Moyenne",
          dueDate: input.dueDate,
          assignedTo: input.assignedTo,
          createdBy: ctx.user?.id,
        });
      } catch (error) {
        console.error("[Tasks] Error creating:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create task" });
      }
    }),

  updateTask: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.string().optional(),
      priority: z.string().optional(),
      dueDate: z.date().optional(),
      assignedTo: z.number().optional(),
      progress: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        return await updateTask(input.id, {
          title: input.title,
          description: input.description,
          status: input.status as any,
          priority: input.priority as any,
          dueDate: input.dueDate,
          assignedTo: input.assignedTo,
        });
      } catch (error) {
        console.error("[Tasks] Error updating:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update task" });
      }
    }),

  deleteTask: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await deleteTask(input.id);
        return { success: true };
      } catch (error) {
        console.error("[Tasks] Error deleting:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete task" });
      }
    }),

  // ============ PROJECT MEMBERS ============
  getMembers: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      try {
        return await getProjectMembers(input.projectId);
      } catch (error) {
        console.error("[ProjectMembers] Error listing:", error);
        return [];
      }
    }),

  addMember: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      userId: z.number(),
      role: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        return await addProjectMember({
          projectId: input.projectId,
          userId: input.userId,
          role: input.role || "member",
        });
      } catch (error) {
        console.error("[ProjectMembers] Error adding:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to add member" });
      }
    }),

  removeMember: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      userId: z.number(),
    }))
    .mutation(async ({ input }) => {
      try {
        await removeProjectMember(input.projectId, input.userId);
        return { success: true };
      } catch (error) {
        console.error("[ProjectMembers] Error removing:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to remove member" });
      }
    }),

  // ============ PROJECT EXPENSES ============
  getExpenses: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      try {
        return await getProjectExpenses(input.projectId);
      } catch (error) {
        console.error("[ProjectExpenses] Error listing:", error);
        return [];
      }
    }),

  addExpense: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      amount: z.string(),
      category: z.string().optional(),
      date: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await addProjectExpense({
          projectId: input.projectId,
          title: input.title,
          description: input.description,
          amount: parseFloat(input.amount).toString(),
          category: input.category,
          date: input.date,
          createdBy: ctx.user?.id,
        });
      } catch (error) {
        console.error("[ProjectExpenses] Error adding:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to add expense" });
      }
    }),

  deleteExpense: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await deleteProjectExpense(input.id);
        return { success: true };
      } catch (error) {
        console.error("[ProjectExpenses] Error deleting:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete expense" });
      }
    }),
});
