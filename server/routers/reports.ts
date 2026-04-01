import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { cotisations, depenses, members } from "../../drizzle/schema";
import { sql } from "drizzle-orm";

export const reportsRouter = router({
  /**
   * Obtenir les statistiques financières pour le rapport
   */
  getFinancialStats: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Statistiques de base
      const totalCotisations = await db
        .select({ total: sql`COUNT(*)` })
        .from(cotisations);

      const totalDepenses = await db
        .select({ total: sql`COUNT(*)` })
        .from(depenses);

      return {
        cotisations: (totalCotisations[0]?.total as number) || 0,
        depenses: (totalDepenses[0]?.total as number) || 0,
        timestamp: new Date(),
      };
    }),

  /**
   * Générer un rapport financier complet
   */
  generateFinancialReport: protectedProcedure
    .input(
      z.object({
        month: z.number().min(1).max(12),
        year: z.number().min(2000),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0);

      // Récupérer les données du mois
      const monthCotisations = await db
        .select()
        .from(cotisations)
        .where(
          sql`DATE(${cotisations.createdAt}) BETWEEN ${startDate} AND ${endDate}`
        );

      const monthDepenses = await db
        .select()
        .from(depenses)
        .where(
          sql`DATE(${depenses.createdAt}) BETWEEN ${startDate} AND ${endDate}`
        );

      return {
        period: `${input.month}/${input.year}`,
        cotisations: monthCotisations,
        depenses: monthDepenses,
        summary: {
          totalCotisations: monthCotisations.length,
          totalDepenses: monthDepenses.length,
        },
      };
    }),

  /**
   * Obtenir les données pour le rapport des membres
   */
  getMembersReport: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allMembers = await db.select().from(members);

    const activeMembers = allMembers.filter((m) => m.status === "active");
    const inactiveMembers = allMembers.filter((m) => m.status === "inactive");

    return {
      total: allMembers.length,
      active: activeMembers.length,
      inactive: inactiveMembers.length,
      byRole: allMembers.reduce(
        (acc, m) => {
          acc[m.role || "unknown"] = (acc[m.role || "unknown"] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      members: allMembers,
    };
  }),

  /**
   * Obtenir les données pour le graphique de dépenses
   */
  getExpensesChart: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allDepenses = await db.select().from(depenses);

    // Grouper par catégorie
    const byCategory = allDepenses.reduce(
      (acc, e) => {
        const category = e.categorie || "Autre";
        acc[category] = (acc[category] || 0) + (typeof e.montant === 'number' ? e.montant : 0);
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(byCategory).map(([name, value]) => ({
      name,
      value,
    }));
  }),

  /**
   * Obtenir les données pour le graphique de cotisations
   */
  getCotisationsChart: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allCotisations = await db.select().from(cotisations);

    return allCotisations.map((c) => ({
      name: `Cotisation ${c.id}`,
      montant: typeof c.montant === 'number' ? c.montant : 0,
      statut: c.statut || "pending",
    }));
  }),
});
