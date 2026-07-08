import { getDb } from "../db";
import { members, cotisations } from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export async function getAdherentsByYear(year: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  // Get all members with their cotisations for the specified year
  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${year}-12-31`);

  const adherents = await db
    .select({
      id: members.id,
      memberId: members.memberId,
      firstName: members.firstName,
      lastName: members.lastName,
      email: members.email,
      phone: members.phone,
      cotisationId: cotisations.id,
      cotisationAmount: cotisations.montant,
      cotisationStatus: cotisations.statut,
      cotisationStartDate: cotisations.dateDebut,
      cotisationEndDate: cotisations.dateFin,
    })
    .from(members)
    .leftJoin(
      cotisations,
      and(
        eq(members.id, cotisations.memberId),
        gte(cotisations.dateDebut, startDate),
        lte(cotisations.dateDebut, endDate)
      )
    );

  return adherents;
}

export async function getAdherentsByYearAndStatus(
  year: number,
  status: string
) {
  const adherents = await getAdherentsByYear(year);

  return adherents.filter((a: any) => {
    if (!a.cotisationStatus) return false;
    return a.cotisationStatus.toLowerCase() === status.toLowerCase();
  });
}

export async function getAdherentStatistics(year: number) {
  const adherents = await getAdherentsByYear(year);

  const total = adherents.filter((a: any) => a.cotisationId).length;
  const upToDate = adherents.filter(
    (a: any) => a.cotisationStatus === "payée"
  ).length;
  const overdue = adherents.filter(
    (a: any) => a.cotisationStatus === "en retard"
  ).length;
  const unpaid = adherents.filter(
    (a: any) => a.cotisationStatus === "impayé"
  ).length;
  const exempt = adherents.filter(
    (a: any) => a.cotisationStatus === "exempté"
  ).length;

  const totalAmount = adherents.reduce(
    (sum: number, a: any) =>
      sum + (a.cotisationAmount ? parseFloat(a.cotisationAmount) : 0),
    0
  );

  return {
    total,
    upToDate,
    overdue,
    unpaid,
    exempt,
    totalAmount,
  };
}

export async function searchAdherents(
  year: number,
  query: string,
  status?: string
) {
  const adherents = await getAdherentsByYear(year);

  let filtered = adherents.filter((a: any) => {
    if (!a.cotisationId) return false;

    const searchLower = query.toLowerCase();
    const matchesQuery =
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchLower) ||
      a.email?.toLowerCase().includes(searchLower) ||
      a.memberId?.toLowerCase().includes(searchLower);

    if (!matchesQuery) return false;

    if (status) {
      return a.cotisationStatus?.toLowerCase() === status.toLowerCase();
    }

    return true;
  });

  return filtered;
}

export async function getAdherentById(memberId: number, year: number) {
  const adherents = await getAdherentsByYear(year);
  return adherents.find((a: any) => a.id === memberId);
}
