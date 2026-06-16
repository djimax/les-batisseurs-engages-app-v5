import { eq, like, and } from "drizzle-orm";
import { getDb } from "../db";
import { groups, groupMembers } from "../../drizzle/schema";
import type { Group, InsertGroup } from "../../drizzle/schema";

export async function listGroups(filters?: {
  status?: string;
  city?: string;
  search?: string;
}): Promise<Group[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query: any = db.select().from(groups);

  if (filters?.status) {
    query = query.where(eq(groups.status, filters.status as any));
  }

  if (filters?.city) {
    query = query.where(eq(groups.city, filters.city));
  }

  if (filters?.search) {
    query = query.where(like(groups.name, `%${filters.search}%`));
  }

  return query.orderBy(groups.name);
}

export async function getGroupById(id: number): Promise<Group | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(groups)
    .where(eq(groups.id, id))
    .limit(1);

  return result[0] || null;
}

export async function createGroup(data: InsertGroup): Promise<Group> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(groups).values(data);
  const id = result[0].insertId;
  const group = await getGroupById(Number(id));
  if (!group) throw new Error("Failed to create group");
  return group;
}

export async function updateGroup(
  id: number,
  data: Partial<InsertGroup>
): Promise<Group> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(groups).set(data).where(eq(groups.id, id));
  const group = await getGroupById(id);
  if (!group) throw new Error("Group not found");
  return group;
}

export async function deleteGroup(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete group members first
  await db.delete(groupMembers).where(eq(groupMembers.groupId, id));
  // Delete group
  await db.delete(groups).where(eq(groups.id, id));
}

export async function getGroupMembers(groupId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(groupMembers)
    .where(eq(groupMembers.groupId, groupId));
}

export async function addMemberToGroup(
  groupId: number,
  memberId: number,
  role: "member" | "coordinator" | "leader" = "member"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(groupMembers).values({
    groupId,
    memberId,
    role,
  });
  return result;
}

export async function removeMemberFromGroup(
  groupId: number,
  memberId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.memberId, memberId)
      )
    );
}

export async function updateMemberRoleInGroup(
  groupId: number,
  memberId: number,
  role: "member" | "coordinator" | "leader"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(groupMembers)
    .set({ role })
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.memberId, memberId)
      )
    );
}

export async function getGroupsByCity(city: string): Promise<Group[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(groups)
    .where(eq(groups.city, city))
    .orderBy(groups.name);
}

export async function getActiveGroups(): Promise<Group[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(groups)
    .where(eq(groups.status, "active"))
    .orderBy(groups.name);
}
