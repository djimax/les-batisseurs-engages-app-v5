import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getActiveCotisationCriteria,
  getCotisationCriteriaById,
  createCotisationCriteria,
  updateCotisationCriteria,
  deleteCotisationCriteria,
  deactivateCotisationCriteria,
} from "../db";

export const cotisationSettingsRouter = router({
  getAll: protectedProcedure.query(async () => {
    return getActiveCotisationCriteria();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getCotisationCriteriaById(input.id);
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        montantAnnuel: z.string().or(z.number()),
        dateDebut: z.date().or(z.string()),
        dateFin: z.date().or(z.string()),
        joursRetardMax: z.number().default(30),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Only admins can create cotisation criteria");
      }
      return createCotisationCriteria({
        name: input.name,
        description: input.description,
        montantAnnuel: input.montantAnnuel as any,
        dateDebut: new Date(input.dateDebut),
        dateFin: new Date(input.dateFin),
        joursRetardMax: input.joursRetardMax,
        isActive: true,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        montantAnnuel: z.string().or(z.number()).optional(),
        dateDebut: z.date().or(z.string()).optional(),
        dateFin: z.date().or(z.string()).optional(),
        joursRetardMax: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Only admins can update cotisation criteria");
      }
      const { id, ...data } = input;
      const updateData: any = { ...data };
      if (data.dateDebut) updateData.dateDebut = new Date(data.dateDebut);
      if (data.dateFin) updateData.dateFin = new Date(data.dateFin);
      return updateCotisationCriteria(id, updateData);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Only admins can delete cotisation criteria");
      }
      await deleteCotisationCriteria(input.id);
      return { success: true };
    }),

  deactivate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Only admins can deactivate cotisation criteria");
      }
      await deactivateCotisationCriteria(input.id);
      return { success: true };
    }),
});
