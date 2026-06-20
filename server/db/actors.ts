import { getDb } from "../db";
import { actors, actorRoles } from "../../drizzle/schema";
import type { Actor, InsertActor, ActorRole, InsertActorRole } from "../../drizzle/schema";
import { eq, like } from "drizzle-orm";

export async function listActors(filters?: {
  status?: string;
  role?: string;
  search?: string;
}): Promise<Actor[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query: any = db.select().from(actors);

  if (filters?.status) {
    query = query.where(eq(actors.status, filters.status as any));
  }

  if (filters?.role) {
    query = query.where(like(actors.role, `%${filters.role}%`));
  }

  if (filters?.search) {
    query = query.where(like(actors.name, `%${filters.search}%`));
  }

  return query.orderBy(actors.name);
}

export async function getActorById(id: number): Promise<Actor | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(actors)
    .where(eq(actors.id, id))
    .limit(1);

  return result[0] || null;
}

export async function createActor(data: InsertActor): Promise<Actor> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(actors).values(data);
  const id = result[0].insertId;
  const actor = await getActorById(Number(id));
  if (!actor) throw new Error("Failed to create actor");
  return actor;
}

export async function updateActor(
  id: number,
  data: Partial<InsertActor>
): Promise<Actor> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(actors).set(data).where(eq(actors.id, id));
  const actor = await getActorById(id);
  if (!actor) throw new Error("Actor not found");
  return actor;
}

export async function deleteActor(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete actor roles first
  await db.delete(actorRoles).where(eq(actorRoles.actorId, id));
  // Delete actor
  await db.delete(actors).where(eq(actors.id, id));
}

export async function getActorRoles(actorId: number): Promise<ActorRole[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(actorRoles)
    .where(eq(actorRoles.actorId, actorId))
    .orderBy(actorRoles.assignedAt);
}

export async function addActorRole(data: InsertActorRole): Promise<ActorRole> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(actorRoles).values(data);
  const id = result[0].insertId;
  
  const role = await db
    .select()
    .from(actorRoles)
    .where(eq(actorRoles.id, Number(id)))
    .limit(1);

  if (!role[0]) throw new Error("Failed to create actor role");
  return role[0];
}

export async function updateActorRole(
  id: number,
  data: Partial<InsertActorRole>
): Promise<ActorRole> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(actorRoles).set(data).where(eq(actorRoles.id, id));
  
  const role = await db
    .select()
    .from(actorRoles)
    .where(eq(actorRoles.id, id))
    .limit(1);

  if (!role[0]) throw new Error("Actor role not found");
  return role[0];
}

export async function deleteActorRole(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(actorRoles).where(eq(actorRoles.id, id));
}

export async function getActorsByRole(role: string): Promise<Actor[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(actors)
    .where(like(actors.role, `%${role}%`))
    .orderBy(actors.name);
}

export async function getActorsByStatus(status: string): Promise<Actor[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(actors)
    .where(eq(actors.status, status as any))
    .orderBy(actors.name);
}
