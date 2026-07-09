import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { cotisations, members } from "../../drizzle/schema";
import { eq, and, lt, gte, lte } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

export const adhesionRenewalsRouter = router({
  // Récupérer les adhésions expirées
  getExpiredAdhesions: publicProcedure
    .input(z.object({ daysBeforeExpiry: z.number().optional().default(15) }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return [];

        const now = new Date();
        const futureDate = new Date(now.getTime() + input.daysBeforeExpiry * 24 * 60 * 60 * 1000);

        const expiring = await db
          .select({
            id: cotisations.id,
            memberId: cotisations.memberId,
            firstName: members.firstName,
            lastName: members.lastName,
            email: members.email,
            montant: cotisations.montant,
            dateDebut: cotisations.dateDebut,
            dateFin: cotisations.dateFin,
            statut: cotisations.statut,
          })
          .from(cotisations)
          .leftJoin(members, eq(cotisations.memberId, members.id))
          .where(
            and(
              lt(cotisations.dateFin, futureDate),
              gte(cotisations.dateFin, now)
            )
          );

        return expiring.map((item: any) => ({
          ...item,
          daysUntilExpiry: Math.ceil(
            (new Date(item.dateFin).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          ),
        }));
      } catch (error) {
        console.error("Error fetching expiring adhesions:", error);
        return [];
      }
    }),

  // Créer un renouvellement automatique
  createRenewal: protectedProcedure
    .input(
      z.object({
        cotisationId: z.number(),
        memberId: z.number(),
        amount: z.number(),
        year: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          return { success: false, message: "Database not initialized" };
        }

        const startDate = new Date(`${input.year}-01-01`);
        const endDate = new Date(`${input.year}-12-31`);

        // Créer la nouvelle cotisation
        const result = await db.insert(cotisations).values({
          memberId: input.memberId,
          montant: input.amount.toString(),
          dateDebut: startDate,
          dateFin: endDate,
          statut: "payée",
        });

        // Notifier le propriétaire
        await notifyOwner({
          title: "Renouvellement d'adhésion créé",
          content: `Adhésion renouvelée pour l'année ${input.year}. Montant: ${input.amount}€`,
        });

        return {
          success: true,
          message: "Renouvellement créé avec succès",
          renewalId: 0,
        };
      } catch (error) {
        console.error("Error creating renewal:", error);
        return {
          success: false,
          message: "Erreur lors de la création du renouvellement",
        };
      }
    }),

  // Créer les renouvellements en masse
  createBulkRenewals: protectedProcedure
    .input(
      z.object({
        year: z.number(),
        amount: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          return { success: false, count: 0, message: "Database not initialized" };
        }

        const now = new Date();
        const endOfYear = new Date(input.year, 11, 31);

        // Récupérer les adhésions expirées
        const expiring = await db
          .select({
            id: cotisations.id,
            memberId: cotisations.memberId,
            dateFin: cotisations.dateFin,
          })
          .from(cotisations)
          .where(
            and(
              lt(cotisations.dateFin, now),
              gte(cotisations.dateFin, new Date(`${input.year - 1}-01-01`))
            )
          );

        let count = 0;
        const startDate = new Date(`${input.year}-01-01`);
        const endDate = new Date(`${input.year}-12-31`);

        for (const item of expiring) {
          try {
            await db.insert(cotisations).values({
              memberId: item.memberId,
              montant: input.amount.toString(),
              dateDebut: startDate,
              dateFin: endDate,
              statut: "payée",
            });
            count++;
          } catch (error) {
            console.error(`Error renewing adhesion for member ${item.memberId}:`, error);
          }
        }

        // Notifier le propriétaire
        await notifyOwner({
          title: `${count} renouvellements d'adhésion créés`,
          content: `${count} adhésions ont été renouvelées pour l'année ${input.year}`,
        });

        return {
          success: true,
          count,
          message: `${count} renouvellements créés`,
        };
      } catch (error) {
        console.error("Error creating bulk renewals:", error);
        return {
          success: false,
          count: 0,
          message: "Erreur lors de la création des renouvellements",
        };
      }
    }),

  // Récupérer les statistiques de renouvellement
  getRenewalStatistics: publicProcedure
    .input(z.object({ year: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return {
            totalExpiring: 0,
            renewedCount: 0,
            pendingCount: 0,
            renewalRate: 0,
          };
        }

        const now = new Date();
        const startOfYear = new Date(`${input.year}-01-01`);
        const endOfYear = new Date(`${input.year}-12-31`);

        // Adhésions expirées l'année précédente
        const expiredLastYear = await db
          .select({ id: cotisations.id })
          .from(cotisations)
          .where(
            and(
              lt(cotisations.dateFin, startOfYear),
              gte(cotisations.dateFin, new Date(`${input.year - 1}-01-01`))
            )
          );

        // Adhésions pour l'année actuelle
        const renewedThisYear = await db
          .select({ id: cotisations.id })
          .from(cotisations)
          .where(
            and(
              gte(cotisations.dateDebut, startOfYear),
              lte(cotisations.dateDebut, endOfYear)
            )
          );

        const totalExpiring = expiredLastYear.length;
        const renewedCount = renewedThisYear.length;
        const pendingCount = totalExpiring - renewedCount;
        const renewalRate = totalExpiring > 0 ? (renewedCount / totalExpiring) * 100 : 0;

        return {
          totalExpiring,
          renewedCount,
          pendingCount,
          renewalRate: parseFloat(renewalRate.toFixed(1)),
        };
      } catch (error) {
        console.error("Error fetching renewal statistics:", error);
        return {
          totalExpiring: 0,
          renewedCount: 0,
          pendingCount: 0,
          renewalRate: 0,
        };
      }
    }),

  // Envoyer des rappels de renouvellement
  sendRenewalReminders: protectedProcedure
    .input(z.object({ daysBeforeExpiry: z.number().optional().default(15) }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          return { success: false, count: 0, message: "Database not initialized" };
        }

        const now = new Date();
        const futureDate = new Date(now.getTime() + input.daysBeforeExpiry * 24 * 60 * 60 * 1000);

        const expiring = await db
          .select({
            id: cotisations.id,
            memberId: cotisations.memberId,
            firstName: members.firstName,
            lastName: members.lastName,
            email: members.email,
            dateFin: cotisations.dateFin,
            montant: cotisations.montant,
          })
          .from(cotisations)
          .leftJoin(members, eq(cotisations.memberId, members.id))
          .where(
            and(
              lt(cotisations.dateFin, futureDate),
              gte(cotisations.dateFin, now)
            )
          );

        let count = 0;
        for (const item of expiring) {
          const daysUntilExpiry = Math.ceil(
            (new Date(item.dateFin).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          await notifyOwner({
            title: `Rappel: Adhésion expire bientôt - ${item.firstName} ${item.lastName}`,
            content: `L'adhésion de ${item.firstName} ${item.lastName} expire dans ${daysUntilExpiry} jours. Montant: ${item.montant}€`,
          });
          count++;
        }

        return {
          success: true,
          count,
          message: `${count} rappels envoyés`,
        };
      } catch (error) {
        console.error("Error sending renewal reminders:", error);
        return {
          success: false,
          count: 0,
          message: "Erreur lors de l'envoi des rappels",
        };
      }
    }),
});
