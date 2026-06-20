import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import * as actorsDb from "../db/actors";

const actorSchema = z.object({
  name: z.string().min(1, "Le nom de l'acteur est obligatoire"),
  email: z.string().email("Email invalide").optional(),
  phone: z.string().optional(),
  role: z.string().min(1, "Le rôle est obligatoire"),
  responsibilities: z.string().optional(),
  permissions: z.array(z.string()).default([]),
  photoUrl: z.string().optional(),
  status: z.enum(["active", "inactive", "on_leave"]).default("active"),
});

const actorRoleSchema = z.object({
  actorId: z.number().min(1, "L'ID de l'acteur est obligatoire"),
  projectId: z.number().optional(),
  role: z.string().min(1, "Le rôle est obligatoire"),
  permissions: z.array(z.string()).default([]),
});

export const actorsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        status: z.string().optional(),
        role: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return actorsDb.listActors({
        status: input.status,
        role: input.role,
        search: input.search,
      });
    }),

  getById: publicProcedure
    .input(z.number())
    .query(async ({ input }) => {
      return actorsDb.getActorById(input);
    }),

  create: protectedProcedure
    .input(actorSchema)
    .mutation(async ({ input }) => {
      return actorsDb.createActor(input);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: actorSchema.partial(),
      })
    )
    .mutation(async ({ input }) => {
      return actorsDb.updateActor(input.id, input.data);
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      await actorsDb.deleteActor(input);
      return { success: true };
    }),

  getRoles: publicProcedure
    .input(z.number())
    .query(async ({ input }) => {
      return actorsDb.getActorRoles(input);
    }),

  addRole: protectedProcedure
    .input(actorRoleSchema)
    .mutation(async ({ input }) => {
      return actorsDb.addActorRole(input);
    }),

  updateRole: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: actorRoleSchema.partial(),
      })
    )
    .mutation(async ({ input }) => {
      return actorsDb.updateActorRole(input.id, input.data);
    }),

  deleteRole: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      await actorsDb.deleteActorRole(input);
      return { success: true };
    }),

  getByRole: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      return actorsDb.getActorsByRole(input);
    }),

  getByStatus: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      return actorsDb.getActorsByStatus(input);
    }),
});
