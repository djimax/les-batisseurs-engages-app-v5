import { describe, it, expect } from "vitest";
import type { CotisationStatus } from "@/components/CotisationStatusBadge";

// Mock data for testing
const mockMembers = [
  {
    id: 1,
    firstName: "Alice",
    lastName: "Dupont",
    email: "alice@example.com",
    memberId: "105260001",
    cotisationStatus: "à_jour" as CotisationStatus,
    status: "active",
  },
  {
    id: 2,
    firstName: "Bob",
    lastName: "Martin",
    email: "bob@example.com",
    memberId: "205260002",
    cotisationStatus: "en_retard" as CotisationStatus,
    status: "active",
  },
  {
    id: 3,
    firstName: "Charlie",
    lastName: "Durand",
    email: "charlie@example.com",
    memberId: "305260003",
    cotisationStatus: "impayé" as CotisationStatus,
    status: "inactive",
  },
  {
    id: 4,
    firstName: "Diana",
    lastName: "Bernard",
    email: "diana@example.com",
    memberId: "205260004",
    cotisationStatus: "exempté" as CotisationStatus,
    status: "active",
  },
];

describe("Members Cotisation Filter", () => {
  it("should filter members by 'à_jour' status", () => {
    const filtered = mockMembers.filter(
      (m) => m.cotisationStatus === "à_jour"
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].firstName).toBe("Alice");
  });

  it("should filter members by 'en_retard' status", () => {
    const filtered = mockMembers.filter(
      (m) => m.cotisationStatus === "en_retard"
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].firstName).toBe("Bob");
  });

  it("should filter members by 'impayé' status", () => {
    const filtered = mockMembers.filter(
      (m) => m.cotisationStatus === "impayé"
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].firstName).toBe("Charlie");
  });

  it("should filter members by 'exempté' status", () => {
    const filtered = mockMembers.filter(
      (m) => m.cotisationStatus === "exempté"
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].firstName).toBe("Diana");
  });

  it("should return all members when filter is empty", () => {
    const cotisationFilter = "";
    const filtered = mockMembers.filter(
      (m) => !cotisationFilter || m.cotisationStatus === cotisationFilter
    );
    expect(filtered).toHaveLength(4);
  });

  it("should combine search and cotisation filters", () => {
    const searchTerm = "martin";
    const cotisationFilter = "en_retard";
    const filtered = mockMembers.filter((m) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        m.firstName.toLowerCase().includes(searchLower) ||
        m.lastName.toLowerCase().includes(searchLower) ||
        (m.email && m.email.toLowerCase().includes(searchLower));
      const matchesCotisation =
        !cotisationFilter || m.cotisationStatus === cotisationFilter;
      return matchesSearch && matchesCotisation;
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].firstName).toBe("Bob");
  });

  it("should return empty array when no members match both filters", () => {
    const searchTerm = "alice";
    const cotisationFilter = "impayé";
    const filtered = mockMembers.filter((m) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        m.firstName.toLowerCase().includes(searchLower) ||
        m.lastName.toLowerCase().includes(searchLower) ||
        (m.email && m.email.toLowerCase().includes(searchLower));
      const matchesCotisation =
        !cotisationFilter || m.cotisationStatus === cotisationFilter;
      return matchesSearch && matchesCotisation;
    });
    expect(filtered).toHaveLength(0);
  });

  it("should count members by cotisation status", () => {
    const counts = {
      à_jour: mockMembers.filter((m) => m.cotisationStatus === "à_jour")
        .length,
      en_retard: mockMembers.filter((m) => m.cotisationStatus === "en_retard")
        .length,
      impayé: mockMembers.filter((m) => m.cotisationStatus === "impayé").length,
      exempté: mockMembers.filter((m) => m.cotisationStatus === "exempté")
        .length,
    };
    expect(counts.à_jour).toBe(1);
    expect(counts.en_retard).toBe(1);
    expect(counts.impayé).toBe(1);
    expect(counts.exempté).toBe(1);
  });
});
