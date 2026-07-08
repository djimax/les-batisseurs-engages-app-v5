import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  getAdherentsByYear,
  getAdherentsByYearAndStatus,
  getAdherentStatistics,
  searchAdherents,
  getAdherentById,
} from "../db/adherents";

export const adherentsRouter = router({
  getByYear: publicProcedure
    .input(z.object({ year: z.number() }))
    .query(async ({ input }) => {
      try {
        const adherents = await getAdherentsByYear(input.year);
        return adherents;
      } catch (error) {
        console.error("Error fetching adherents:", error);
        return [];
      }
    }),

  getByYearAndStatus: publicProcedure
    .input(
      z.object({
        year: z.number(),
        status: z.enum(["payée", "en retard", "impayé", "exempté"]),
      })
    )
    .query(async ({ input }) => {
      try {
        const adherents = await getAdherentsByYearAndStatus(
          input.year,
          input.status
        );
        return adherents;
      } catch (error) {
        console.error("Error fetching adherents by status:", error);
        return [];
      }
    }),

  getStatistics: publicProcedure
    .input(z.object({ year: z.number() }))
    .query(async ({ input }) => {
      try {
        const stats = await getAdherentStatistics(input.year);
        return stats;
      } catch (error) {
        console.error("Error fetching adherent statistics:", error);
        return {
          total: 0,
          upToDate: 0,
          overdue: 0,
          unpaid: 0,
          exempt: 0,
          totalAmount: 0,
        };
      }
    }),

  search: publicProcedure
    .input(
      z.object({
        year: z.number(),
        query: z.string(),
        status: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const results = await searchAdherents(
          input.year,
          input.query,
          input.status
        );
        return results;
      } catch (error) {
        console.error("Error searching adherents:", error);
        return [];
      }
    }),

  getById: publicProcedure
    .input(z.object({ memberId: z.number(), year: z.number() }))
    .query(async ({ input }) => {
      try {
        const adherent = await getAdherentById(input.memberId, input.year);
        return adherent || null;
      } catch (error) {
        console.error("Error fetching adherent:", error);
        return null;
      }
    }),
});
