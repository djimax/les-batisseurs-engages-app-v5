import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import * as groupsDb from "../db/groups";

const groupSchema = z.object({
  name: z.string().min(1, "Le nom du groupe est obligatoire"),
  description: z.string().optional(),
  location: z.string().min(1, "La localisation est obligatoire"),
  city: z.string().min(1, "La ville est obligatoire"),
  region: z.string().optional(),
  country: z.string().default("France"),
  responsibleId: z.number().optional(),
  responsibleName: z.string().optional(),
  responsibleEmail: z.string().email().optional(),
  responsiblePhone: z.string().optional(),
  responsiblePhotoUrl: z.string().optional(),
  status: z.enum(["active", "inactive", "pending"]).default("active"),
  photoUrl: z.string().optional(),
});

export const groupsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        status: z.string().optional(),
        city: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }: { input: { status?: string; city?: string; search?: string } }) => {
      return groupsDb.listGroups({
        status: input.status,
        city: input.city,
        search: input.search,
      });
    }),

  getById: publicProcedure
    .input(z.number())
    .query(async ({ input }: { input: number }) => {
      return groupsDb.getGroupById(input);
    }),

  create: protectedProcedure
    .input(groupSchema)
    .mutation(async ({ input }: any) => {
      return groupsDb.createGroup(input);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: groupSchema.partial(),
      })
    )
    .mutation(async ({ input }: any) => {
      return groupsDb.updateGroup(input.id, input.data);
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }: { input: number }) => {
      await groupsDb.deleteGroup(input);
      return { success: true };
    }),

  getMembers: publicProcedure
    .input(z.number())
    .query(async ({ input }: { input: number }) => {
      return groupsDb.getGroupMembers(input);
    }),

  addMember: protectedProcedure
    .input(
      z.object({
        groupId: z.number(),
        memberId: z.number(),
        role: z.enum(["member", "coordinator", "leader"]).default("member"),
      })
    )
    .mutation(async ({ input }: { input: { groupId: number; memberId: number; role: "member" | "coordinator" | "leader" } }) => {
      return groupsDb.addMemberToGroup(input.groupId, input.memberId, input.role);
    }),

  removeMember: protectedProcedure
    .input(
      z.object({
        groupId: z.number(),
        memberId: z.number(),
      })
    )
    .mutation(async ({ input }: { input: { groupId: number; memberId: number } }) => {
      await groupsDb.removeMemberFromGroup(input.groupId, input.memberId);
      return { success: true };
    }),

  updateMemberRole: protectedProcedure
    .input(
      z.object({
        groupId: z.number(),
        memberId: z.number(),
        role: z.enum(["member", "coordinator", "leader"]),
      })
    )
    .mutation(async ({ input }: { input: { groupId: number; memberId: number; role: "member" | "coordinator" | "leader" } }) => {
      await groupsDb.updateMemberRoleInGroup(input.groupId, input.memberId, input.role);
      return { success: true };
    }),

  getByCity: publicProcedure
    .input(z.string())
    .query(async ({ input }: { input: string }) => {
      return groupsDb.getGroupsByCity(input);
    }),

  getActive: publicProcedure.query(async () => {
    return groupsDb.getActiveGroups();
  }),
});
