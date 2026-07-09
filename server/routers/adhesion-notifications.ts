import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { cotisations, members } from "../../drizzle/schema";
import { eq, and, lt, gte } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

export const adhesionNotificationsRouter = router({
  // Récupérer les adhérents en retard
  getOverdueAdherents: publicProcedure
    .input(z.object({ year: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return [];

        const now = new Date();
        const startOfYear = new Date(`${input.year}-01-01`);
        const endOfYear = new Date(`${input.year}-12-31`);

        const overdue = await db
          .select({
            id: cotisations.id,
            memberId: cotisations.memberId,
            firstName: members.firstName,
            lastName: members.lastName,
            email: members.email,
            montant: cotisations.montant,
            statut: cotisations.statut,
            dateDebut: cotisations.dateDebut,
            dateFin: cotisations.dateFin,
          })
          .from(cotisations)
          .leftJoin(members, eq(cotisations.memberId, members.id))
          .where(
            and(
              gte(cotisations.dateDebut, startOfYear),
              lt(cotisations.dateDebut, endOfYear),
              eq(cotisations.statut, "en retard")
            )
          );

        // Calculer les jours de retard
        return (overdue as any[]).map((item: any) => ({
          ...item,
          daysOverdue: Math.floor(
            (now.getTime() - new Date(item.dateFin).getTime()) / (1000 * 60 * 60 * 24)
          ),
        }));
      } catch (error) {
        console.error("Error fetching overdue adherents:", error);
        return [];
      }
    }),

  // Envoyer notification de rappel
  sendReminderNotification: protectedProcedure
    .input(
      z.object({
        cotisationId: z.number(),
        memberId: z.number(),
        memberEmail: z.string(),
        memberName: z.string(),
        daysOverdue: z.number(),
        amount: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Envoyer notification au propriétaire
        const reminderMessage = `Rappel: ${input.memberName} (${input.memberEmail}) est en retard de paiement depuis ${input.daysOverdue} jours. Montant dû: ${input.amount}€`;

        await notifyOwner({
          title: `Adhérent en retard: ${input.memberName}`,
          content: reminderMessage,
        });

        return {
          success: true,
          message: "Notification envoyée avec succès",
        };
      } catch (error) {
        console.error("Error sending reminder notification:", error);
        return {
          success: false,
          message: "Erreur lors de l'envoi de la notification",
        };
      }
    }),

  // Envoyer notifications en masse pour tous les retards
  sendBulkReminders: protectedProcedure
    .input(z.object({ year: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          return { success: false, count: 0, message: "Database not initialized" };
        }

        const now = new Date();
        const startOfYear = new Date(`${input.year}-01-01`);
        const endOfYear = new Date(`${input.year}-12-31`);

        const overdue = await db
          .select({
            id: cotisations.id,
            memberId: cotisations.memberId,
            firstName: members.firstName,
            lastName: members.lastName,
            email: members.email,
            montant: cotisations.montant,
            dateFin: cotisations.dateFin,
          })
          .from(cotisations)
          .leftJoin(members, eq(cotisations.memberId, members.id))
          .where(
            and(
              gte(cotisations.dateDebut, startOfYear),
              lt(cotisations.dateDebut, endOfYear),
              eq(cotisations.statut, "en retard")
            )
          );

        let count = 0;
        for (const item of overdue) {
          const daysOverdue = Math.floor(
            (now.getTime() - new Date(item.dateFin).getTime()) / (1000 * 60 * 60 * 24)
          );

          // Envoyer notification seulement si plus de 7 jours de retard
          if (daysOverdue > 7) {
            await notifyOwner({
              title: `Adhérent en retard: ${item.firstName} ${item.lastName}`,
              content: `${item.firstName} ${item.lastName} (${item.email}) est en retard de ${daysOverdue} jours. Montant: ${item.montant}€`,
            });
            count++;
          }
        }

        return {
          success: true,
          count,
          message: `${count} notifications envoyées`,
        };
      } catch (error) {
        console.error("Error sending bulk reminders:", error);
        return {
          success: false,
          count: 0,
          message: "Erreur lors de l'envoi des notifications",
        };
      }
    }),

  // Récupérer les statistiques des retards
  getOverdueStatistics: publicProcedure
    .input(z.object({ year: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return {
            totalOverdue: 0,
            totalAmount: 0,
            averageDaysOverdue: 0,
            criticalCount: 0, // Plus de 30 jours
          };
        }

        const now = new Date();
        const startOfYear = new Date(`${input.year}-01-01`);
        const endOfYear = new Date(`${input.year}-12-31`);

        const overdue = await db
          .select({
            montant: cotisations.montant,
            dateFin: cotisations.dateFin,
          })
          .from(cotisations)
          .where(
            and(
              gte(cotisations.dateDebut, startOfYear),
              lt(cotisations.dateDebut, endOfYear),
              eq(cotisations.statut, "en retard")
            )
          );

        const totalOverdue = overdue.length;
        const totalAmount = overdue.reduce(
          (sum: number, item: any) => sum + parseFloat(item.montant || 0),
          0
        );

        const daysOverdueList = overdue.map((item: any) =>
          Math.floor(
            (now.getTime() - new Date(item.dateFin).getTime()) / (1000 * 60 * 60 * 24)
          )
        );

        const averageDaysOverdue =
          daysOverdueList.length > 0
            ? Math.round(daysOverdueList.reduce((a, b) => a + b, 0) / daysOverdueList.length)
            : 0;

        const criticalCount = daysOverdueList.filter((days: number) => days > 30).length;

        return {
          totalOverdue,
          totalAmount,
          averageDaysOverdue,
          criticalCount,
        };
      } catch (error) {
        console.error("Error fetching overdue statistics:", error);
        return {
          totalOverdue: 0,
          totalAmount: 0,
          averageDaysOverdue: 0,
          criticalCount: 0,
        };
      }
    }),
});
