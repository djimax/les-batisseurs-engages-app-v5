import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { cotisations, members } from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export const adhesionReportsRouter = router({
  // Récupérer les statistiques mensuelles
  getMonthlyStatistics: publicProcedure
    .input(z.object({ year: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return [];

        const startDate = new Date(`${input.year}-01-01`);
        const endDate = new Date(`${input.year}-12-31`);

        const data = await db
          .select({
            dateDebut: cotisations.dateDebut,
            montant: cotisations.montant,
            statut: cotisations.statut,
          })
          .from(cotisations)
          .where(and(gte(cotisations.dateDebut, startDate), lte(cotisations.dateDebut, endDate)));

        // Grouper par mois
        const monthlyData: Record<string, any> = {};

        for (let month = 1; month <= 12; month++) {
          const monthStr = month.toString().padStart(2, "0");
          monthlyData[monthStr] = {
            month: monthStr,
            total: 0,
            count: 0,
            upToDate: 0,
            overdue: 0,
            unpaid: 0,
            exempt: 0,
            amount: 0,
          };
        }

        data.forEach((item: any) => {
          const date = new Date(item.dateDebut);
          const month = (date.getMonth() + 1).toString().padStart(2, "0");

          if (monthlyData[month]) {
            monthlyData[month].total++;
            monthlyData[month].amount += parseFloat(item.montant || 0);

            if (item.statut === "payée") monthlyData[month].upToDate++;
            else if (item.statut === "en retard") monthlyData[month].overdue++;
            else if (item.statut === "impayé") monthlyData[month].unpaid++;
            else if (item.statut === "exempté") monthlyData[month].exempt++;
          }
        });

        return Object.values(monthlyData);
      } catch (error) {
        console.error("Error fetching monthly statistics:", error);
        return [];
      }
    }),

  // Récupérer les statistiques par statut
  getStatusDistribution: publicProcedure
    .input(z.object({ year: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return [];

        const startDate = new Date(`${input.year}-01-01`);
        const endDate = new Date(`${input.year}-12-31`);

        const data = await db
          .select({
            statut: cotisations.statut,
          })
          .from(cotisations)
          .where(and(gte(cotisations.dateDebut, startDate), lte(cotisations.dateDebut, endDate)));

        const distribution = {
          "À jour": 0,
          "En retard": 0,
          "Impayé": 0,
          "Exempté": 0,
        };

        data.forEach((item: any) => {
          if (item.statut === "payée") distribution["À jour"]++;
          else if (item.statut === "en retard") distribution["En retard"]++;
          else if (item.statut === "impayé") distribution["Impayé"]++;
          else if (item.statut === "exempté") distribution["Exempté"]++;
        });

        return Object.entries(distribution).map(([label, value]) => ({
          label,
          value,
          percentage: data.length > 0 ? ((value / data.length) * 100).toFixed(1) : 0,
        }));
      } catch (error) {
        console.error("Error fetching status distribution:", error);
        return [];
      }
    }),

  // Récupérer les statistiques de taux de paiement
  getPaymentRate: publicProcedure
    .input(z.object({ year: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return { rate: 0, paid: 0, total: 0 };

        const startDate = new Date(`${input.year}-01-01`);
        const endDate = new Date(`${input.year}-12-31`);

        const data = await db
          .select({
            statut: cotisations.statut,
          })
          .from(cotisations)
          .where(and(gte(cotisations.dateDebut, startDate), lte(cotisations.dateDebut, endDate)));

        const paid = data.filter((item: any) => item.statut === "payée").length;
        const total = data.length;
        const rate = total > 0 ? ((paid / total) * 100).toFixed(1) : 0;

        return { rate: parseFloat(rate as string), paid, total };
      } catch (error) {
        console.error("Error fetching payment rate:", error);
        return { rate: 0, paid: 0, total: 0 };
      }
    }),

  // Récupérer les tendances annuelles
  getAnnualTrends: publicProcedure
    .input(z.object({ startYear: z.number(), endYear: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return [];

        const trends = [];

        for (let year = input.startYear; year <= input.endYear; year++) {
          const startDate = new Date(`${year}-01-01`);
          const endDate = new Date(`${year}-12-31`);

          const data = await db
            .select({
              montant: cotisations.montant,
              statut: cotisations.statut,
            })
            .from(cotisations)
            .where(and(gte(cotisations.dateDebut, startDate), lte(cotisations.dateDebut, endDate)));

          const total = data.length;
          const paid = data.filter((item: any) => item.statut === "payée").length;
          const amount = data.reduce((sum: number, item: any) => sum + parseFloat(item.montant || 0), 0);

          trends.push({
            year,
            total,
            paid,
            rate: total > 0 ? ((paid / total) * 100).toFixed(1) : 0,
            amount,
          });
        }

        return trends;
      } catch (error) {
        console.error("Error fetching annual trends:", error);
        return [];
      }
    }),

  // Récupérer les statistiques globales
  getGlobalStatistics: publicProcedure
    .input(z.object({ year: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return {
            totalAdherents: 0,
            totalAmount: 0,
            averageAmount: 0,
            paymentRate: 0,
          };
        }

        const startDate = new Date(`${input.year}-01-01`);
        const endDate = new Date(`${input.year}-12-31`);

        const data = await db
          .select({
            montant: cotisations.montant,
            statut: cotisations.statut,
          })
          .from(cotisations)
          .where(and(gte(cotisations.dateDebut, startDate), lte(cotisations.dateDebut, endDate)));

        const totalAdherents = data.length;
        const totalAmount = data.reduce((sum: number, item: any) => sum + parseFloat(item.montant || 0), 0);
        const averageAmount = totalAdherents > 0 ? totalAmount / totalAdherents : 0;
        const paid = data.filter((item: any) => item.statut === "payée").length;
        const paymentRate = totalAdherents > 0 ? (paid / totalAdherents) * 100 : 0;

        return {
          totalAdherents,
          totalAmount,
          averageAmount,
          paymentRate,
        };
      } catch (error) {
        console.error("Error fetching global statistics:", error);
        return {
          totalAdherents: 0,
          totalAmount: 0,
          averageAmount: 0,
          paymentRate: 0,
        };
      }
    }),
});
