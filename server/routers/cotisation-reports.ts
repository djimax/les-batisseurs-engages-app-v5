import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { cotisations, cotisationCriteria, members } from "../../drizzle/schema";
import { eq, gte, lte, and } from "drizzle-orm";

export const cotisationReportsRouter = router({
  // Get cotisation statistics
  getStatistics: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      const allCotisations = await db.select().from(cotisations);

      const stats = {
        totalCotisations: allCotisations.length,
        paidCount: allCotisations.filter((c: any) => c.statut === "payée").length,
        pendingCount: allCotisations.filter((c: any) => c.statut === "en attente").length,
        overdueCount: allCotisations.filter((c: any) => c.statut === "en retard").length,
        totalAmount: allCotisations.reduce(
          (sum: number, c: any) => sum + (parseFloat(c.montant as any) || 0),
          0
        ),
        paidAmount: allCotisations
          .filter((c: any) => c.statut === "payée")
          .reduce((sum: number, c: any) => sum + (parseFloat(c.montant as any) || 0), 0),
        pendingAmount: allCotisations
          .filter((c: any) => c.statut === "en attente")
          .reduce((sum: number, c: any) => sum + (parseFloat(c.montant as any) || 0), 0),
        overdueAmount: allCotisations
          .filter((c: any) => c.statut === "en retard")
          .reduce((sum: number, c: any) => sum + (parseFloat(c.montant as any) || 0), 0),
      };

      return stats;
    } catch (error) {
      console.error("Error getting cotisation statistics:", error);
      throw new Error("Failed to get statistics");
    }
  }),

  // Get list of overdue cotisations
  getOverdueList: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(100),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ input }: { input: any }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const now = new Date();
        const overdueCotisations = await db
          .select()
          .from(cotisations)
          .where(
            and(
              eq(cotisations.statut, "en retard" as any),
              lte(cotisations.dateFin, now)
            )
          )
          .limit(input.limit)
          .offset(input.offset);

        return overdueCotisations;
      } catch (error) {
        console.error("Error getting overdue list:", error);
        throw new Error("Failed to get overdue list");
      }
    }),

  // Get cotisation report by member
  getByMember: protectedProcedure
    .input(z.number())
    .query(async ({ input: memberId }: { input: number }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const memberCotisations = await db
          .select()
          .from(cotisations)
          .where(eq(cotisations.memberId, memberId));

        const stats = {
          memberId,
          totalCotisations: memberCotisations.length,
          paidCount: memberCotisations.filter((c: any) => c.statut === "payée").length,
          pendingCount: memberCotisations.filter((c: any) => c.statut === "en attente")
            .length,
          overdueCount: memberCotisations.filter((c: any) => c.statut === "en retard")
            .length,
          totalAmount: memberCotisations.reduce(
            (sum: number, c: any) => sum + (parseFloat(c.montant as any) || 0),
            0
          ),
          paidAmount: memberCotisations
            .filter((c: any) => c.statut === "payée")
            .reduce((sum: number, c: any) => sum + (parseFloat(c.montant as any) || 0), 0),
          cotisations: memberCotisations,
        };

        return stats;
      } catch (error) {
        console.error("Error getting member cotisation report:", error);
        throw new Error("Failed to get member report");
      }
    }),

  // Get cotisation report by criteria
  getByCriteria: protectedProcedure
    .input(z.number())
    .query(async ({ input: criteriaId }: { input: number }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const criteria = await db
          .select()
          .from(cotisationCriteria)
          .where(eq(cotisationCriteria.id, criteriaId))
          .limit(1);

        if (!criteria.length) {
          throw new Error("Criteria not found");
        }

        // Note: cotisations table doesn't have criteriaId, filtering would need to be done differently
        const cotisationsByCriteria: any[] = [];

        const stats = {
          criteria: criteria[0],
          totalCotisations: cotisationsByCriteria.length,
          paidCount: cotisationsByCriteria.filter((c: any) => c.statut === "payée")
            .length,
          pendingCount: cotisationsByCriteria.filter((c: any) => c.statut === "en attente")
            .length,
          overdueCount: cotisationsByCriteria.filter((c: any) => c.statut === "en retard")
            .length,
          totalAmount: cotisationsByCriteria.reduce(
            (sum: number, c: any) => sum + (parseFloat(c.montant as any) || 0),
            0
          ),
          paidAmount: cotisationsByCriteria
            .filter((c: any) => c.statut === "payée")
            .reduce((sum: number, c: any) => sum + (parseFloat(c.montant as any) || 0), 0),
          cotisations: cotisationsByCriteria,
        };

        return stats;
      } catch (error) {
        console.error("Error getting criteria cotisation report:", error);
        throw new Error("Failed to get criteria report");
      }
    }),

  // Export cotisations to CSV format
  exportToCSV: protectedProcedure
    .input(
      z.object({
        statut: z.string().optional(),
        memberId: z.number().optional(),
      })
    )
    .query(async ({ input }: { input: any }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        let query: any = db.select().from(cotisations);

        if (input.statut) {
          query = query.where(eq(cotisations.statut, input.statut as any));
        }

        if (input.memberId) {
          query = query.where(eq(cotisations.memberId, input.memberId));
        }

        const data = await query;

        // Convert to CSV format
        const headers = [
          "ID",
          "Member ID",
          "Montant",
          "Statut",
          "Date Fin",
          "Date Payment",
          "Created At",
        ];
        const rows = (data as any[]).map((c: any) => [
          c.id,
          c.memberId,
          c.montant,
          c.statut,
          c.dateFin,
          c.datePayment || "",
          c.createdAt,
        ]);

        const csv = [
          headers.join(","),
          ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
        ].join("\n");

        return { csv, count: data.length };
      } catch (error) {
        console.error("Error exporting to CSV:", error);
        throw new Error("Failed to export");
      }
    }),

  // Get payment history
  getPaymentHistory: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().optional().default(100),
      })
    )
    .query(async ({ input }: { input: any }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        let query: any = db
          .select()
          .from(cotisations)
          .where(eq(cotisations.statut, "payée" as any));

        if (input.startDate && input.endDate) {
          query = query.where(
            and(
              gte(cotisations.datePayment, input.startDate),
              lte(cotisations.datePayment, input.endDate)
            )
          );
        }

        const payments = await query.limit(input.limit);

        const stats = {
          totalPayments: payments.length,
          totalAmount: payments.reduce(
            (sum: number, c: any) => sum + (parseFloat(c.montant as any) || 0),
            0
          ),
          averageAmount:
            payments.length > 0
              ?               payments.reduce(
                  (sum: number, c: any) => sum + (parseFloat(c.montant as any) || 0),
                  0
                ) / payments.length
              : 0,
          payments,
        };

        return stats;
      } catch (error) {
        console.error("Error getting payment history:", error);
        throw new Error("Failed to get payment history");
      }
    }),
});
