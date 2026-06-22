import { getDb } from "../db";
import {
  projects,
  tasks,
  projectMembers,
  projectExpenses,
  projectMilestones,
  type InsertProject,
  type InsertTask,
  type InsertProjectMilestone,
} from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

/**
 * List all projects with optional filters
 */
export async function listProjects(filters?: {
  status?: string;
  year?: number;
  search?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let query: any = db.select().from(projects);

  if (filters?.status) {
    query = query.where(eq(projects.status, filters.status as any));
  }

  // Note: Search filtering is done client-side for now
  // In production, implement full-text search at database level

  return query;
}

/**
 * Get project by ID with related data
 */
export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  if (!project.length) return null;

  const [projectData] = project;

  // Get related data
  const [projectTasks, members, expenses, milestones] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.projectId, id)),
    db.select().from(projectMembers).where(eq(projectMembers.projectId, id)),
    db.select().from(projectExpenses).where(eq(projectExpenses.projectId, id)),
    db
      .select()
      .from(projectMilestones)
      .where(eq(projectMilestones.projectId, id)),
  ]);

  return {
    ...projectData,
    tasks: projectTasks,
    members,
    expenses,
    milestones,
  };
}

/**
 * Create a new project
 */
export async function createProject(data: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projects).values(data);
  return result;
}

/**
 * Update a project
 */
export async function updateProject(id: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .update(projects)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id));

  return result;
}

/**
 * Delete a project and all related data
 */
export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete in order: tasks, expenses, milestones, members, then project
  await db.delete(tasks).where(eq(tasks.projectId, id));
  await db.delete(projectExpenses).where(eq(projectExpenses.projectId, id));
  await db
    .delete(projectMilestones)
    .where(eq(projectMilestones.projectId, id));
  await db.delete(projectMembers).where(eq(projectMembers.projectId, id));
  await db.delete(projects).where(eq(projects.id, id));
}

/**
 * List tasks for a project
 */
export async function listProjectTasks(projectId: number, filters?: {
  status?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let query: any = db.select().from(tasks).where(eq(tasks.projectId, projectId));

  if (filters?.status) {
    query = query.where(eq(tasks.status, filters.status as any));
  }

  return query;
}

/**
 * Create a new task
 */
export async function createTask(data: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tasks).values(data);
  return result;
}

/**
 * Update a task
 */
export async function updateTask(id: number, data: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .update(tasks)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, id));

  return result;
}

/**
 * Delete a task
 */
export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(tasks).where(eq(tasks.id, id));
}

/**
 * List milestones for a project
 */
export async function listProjectMilestones(projectId: number, filters?: {
  status?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let query: any = db
    .select()
    .from(projectMilestones)
    .where(eq(projectMilestones.projectId, projectId));

  if (filters?.status) {
    query = query.where(eq(projectMilestones.status, filters.status as any));
  }

  return query;
}

/**
 * Create a new milestone
 */
export async function createMilestone(data: InsertProjectMilestone) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projectMilestones).values(data);
  return result;
}

/**
 * Update a milestone
 */
export async function updateMilestone(
  id: number,
  data: Partial<InsertProjectMilestone>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .update(projectMilestones)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(projectMilestones.id, id));

  return result;
}

/**
 * Delete a milestone
 */
export async function deleteMilestone(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projectMilestones).where(eq(projectMilestones.id, id));
}

/**
 * Get project statistics
 */
export async function getProjectStats(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const projectData = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!projectData.length) return null;

  const [project] = projectData;

  const [allTasks, completedTasks, milestones, expenses] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.projectId, projectId)),
    db
      .select()
      .from(tasks)
      .where(and(eq(tasks.projectId, projectId), eq(tasks.status, "done"))),
    db
      .select()
      .from(projectMilestones)
      .where(eq(projectMilestones.projectId, projectId)),
    db
      .select()
      .from(projectExpenses)
      .where(eq(projectExpenses.projectId, projectId)),
  ]);

  const totalExpenses = expenses.reduce(
    (sum: number, exp: any) => sum + (parseFloat(exp.amount as any) || 0),
    0
  );

  return {
    totalTasks: allTasks.length,
    completedTasks: completedTasks.length,
    completionPercentage:
      allTasks.length > 0
        ? Math.round((completedTasks.length / allTasks.length) * 100)
        : 0,
    totalMilestones: milestones.length,
    completedMilestones: milestones.filter(
      (m: any) => (m.status as string) === "completed"
    ).length,
    totalExpenses,
    budgetRemaining: project.budget
      ? parseFloat(project.budget as any) - totalExpenses
      : 0,
  };
}

/**
 * Get projects by status
 */
export async function getProjectsByStatus(status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(projects).where(eq(projects.status, status as any));
}

/**
 * Get projects created by a user
 */
export async function getProjectsByCreator(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(projects).where(eq(projects.createdBy, userId));
}
