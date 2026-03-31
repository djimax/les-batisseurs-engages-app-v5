import { eq, and, desc, asc, like, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  usersLocal,
  InsertUserLocal,
  userSessions,
  InsertUserSession,
  members,
  InsertMember,
  Member,
  contacts,
  InsertContact,
  Contact,
  activities,
  InsertActivity,
  projects,
  InsertProject,
  tasks,
  InsertTask,
  budgets,
  InsertBudget,
  invoices,
  InsertInvoice,
  documents,
  InsertDocument,
  notifications,
  InsertNotification,
  notificationPreferences,
  InsertNotificationPreference,
  associationSettings,
  InsertAssociationSettings,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

/**
 * Lazily create the drizzle instance so local tooling can run without a DB.
 */
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * ============================================================================
 * USER HELPERS
 * ============================================================================
 */

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * ============================================================================
 * LOCAL AUTH HELPERS
 * ============================================================================
 */

export async function createLocalUser(user: InsertUserLocal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(usersLocal).values(user);
  return result;
}

export async function getLocalUserByEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(usersLocal)
    .where(eq(usersLocal.email, email))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getLocalUserById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(usersLocal)
    .where(eq(usersLocal.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function createUserSession(session: InsertUserSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(userSessions).values(session);
  return result;
}

export async function getUserSessionByToken(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(userSessions)
    .where(eq(userSessions.sessionToken, token))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function deleteUserSession(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(userSessions).where(eq(userSessions.sessionToken, token));
}

export async function updateLocalUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(usersLocal).set({ passwordHash }).where(eq(usersLocal.id, userId));
}

/**
 * ============================================================================
 * MEMBERS HELPERS
 * ============================================================================
 */

export async function createMember(member: InsertMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(members).values(member);
  return result;
}

export async function getMemberById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(members).where(eq(members.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function listMembers(
  filters?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];

  if (filters?.status) {
    conditions.push(eq(members.status, filters.status as any));
  }

  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      like(members.firstName, searchTerm) || like(members.lastName, searchTerm) || like(members.email, searchTerm)
    );
  }

  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  if (conditions.length > 0) {
    return db
      .select()
      .from(members)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  }

  return db.select().from(members).limit(limit).offset(offset);
}

export async function updateMember(id: number, updates: Partial<InsertMember>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(members).set(updates).where(eq(members.id, id));
}

export async function deleteMember(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(members).where(eq(members.id, id));
}

/**
 * ============================================================================
 * CONTACTS & ACTIVITIES HELPERS
 * ============================================================================
 */

export async function createContact(contact: InsertContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(contacts).values(contact);
  return result;
}

export async function listContacts(
  filters?: {
    type?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];

  if (filters?.type) {
    conditions.push(eq(contacts.type, filters.type as any));
  }

  if (filters?.status) {
    conditions.push(eq(contacts.status, filters.status as any));
  }

  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      like(contacts.firstName, searchTerm) || like(contacts.lastName, searchTerm) || like(contacts.email, searchTerm)
    );
  }

  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  if (conditions.length > 0) {
    return db
      .select()
      .from(contacts)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  }

  return db.select().from(contacts).limit(limit).offset(offset);
}

export async function createActivity(activity: InsertActivity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(activities).values(activity);
  return result;
}

/**
 * ============================================================================
 * PROJECTS & TASKS HELPERS
 * ============================================================================
 */

export async function createProject(project: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(projects).values(project);
  return result;
}

export async function listProjects(
  filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];

  if (filters?.status) {
    conditions.push(eq(projects.status, filters.status as any));
  }

  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  if (conditions.length > 0) {
    return db
      .select()
      .from(projects)
      .where(and(...conditions))
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset);
  }

  return db
    .select()
    .from(projects)
    .orderBy(desc(projects.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createTask(task: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(tasks).values(task);
  return result;
}

export async function listTasksByProject(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(tasks).where(eq(tasks.projectId, projectId));
}

/**
 * ============================================================================
 * FINANCES HELPERS
 * ============================================================================
 */

export async function createBudget(budget: InsertBudget) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(budgets).values(budget);
  return result;
}

export async function listBudgets(
  filters?: {
    year?: number;
    status?: string;
    limit?: number;
    offset?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];

  if (filters?.year) {
    conditions.push(eq(budgets.year, filters.year));
  }

  if (filters?.status) {
    conditions.push(eq(budgets.status, filters.status as any));
  }

  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  if (conditions.length > 0) {
    return db
      .select()
      .from(budgets)
      .where(and(...conditions))
      .orderBy(desc(budgets.createdAt))
      .limit(limit)
      .offset(offset);
  }

  return db
    .select()
    .from(budgets)
    .orderBy(desc(budgets.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function createInvoice(invoice: InsertInvoice) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(invoices).values(invoice);
  return result;
}

export async function listInvoices(
  filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];

  if (filters?.status) {
    conditions.push(eq(invoices.status, filters.status as any));
  }

  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  if (conditions.length > 0) {
    return db
      .select()
      .from(invoices)
      .where(and(...conditions))
      .orderBy(desc(invoices.invoiceDate))
      .limit(limit)
      .offset(offset);
  }

  return db
    .select()
    .from(invoices)
    .orderBy(desc(invoices.invoiceDate))
    .limit(limit)
    .offset(offset);
}

/**
 * ============================================================================
 * DOCUMENTS HELPERS
 * ============================================================================
 */

export async function createDocument(document: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(documents).values(document);
  return result;
}

export async function listDocuments(
  filters?: {
    categoryId?: number;
    status?: string;
    isArchived?: boolean;
    limit?: number;
    offset?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];

  if (filters?.categoryId) {
    conditions.push(eq(documents.categoryId, filters.categoryId));
  }

  if (filters?.status) {
    conditions.push(eq(documents.status, filters.status as any));
  }

  if (filters?.isArchived !== undefined) {
    conditions.push(eq(documents.isArchived, filters.isArchived));
  }

  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  if (conditions.length > 0) {
    return db
      .select()
      .from(documents)
      .where(and(...conditions))
      .orderBy(desc(documents.createdAt))
      .limit(limit)
      .offset(offset);
  }

  return db
    .select()
    .from(documents)
    .orderBy(desc(documents.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * ============================================================================
 * NOTIFICATIONS HELPERS
 * ============================================================================
 */

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(notifications).values(notification);
  return result;
}

export async function listNotifications(
  userId: number,
  filters?: {
    isRead?: boolean;
    limit?: number;
    offset?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(notifications.userId, userId)];

  if (filters?.isRead !== undefined) {
    conditions.push(eq(notifications.isRead, filters.isRead));
  }

  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  return db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(notifications).set({ isRead: true, readAt: new Date() }).where(eq(notifications.id, id));
}

/**
 * ============================================================================
 * ASSOCIATION SETTINGS HELPERS
 * ============================================================================
 */

export async function getAssociationSettings(associationId: number = 1) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(associationSettings)
    .where(eq(associationSettings.associationId, associationId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateAssociationSettings(
  associationId: number,
  updates: Partial<InsertAssociationSettings>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(associationSettings)
    .set(updates)
    .where(eq(associationSettings.associationId, associationId));
}

export async function createAssociationSettings(settings: InsertAssociationSettings) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(associationSettings).values(settings);
  return result;
}
