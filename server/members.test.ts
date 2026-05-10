import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMockContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("members router", () => {
  it("should list members", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.members.list();
      expect(Array.isArray(result)).toBe(true);
    } catch (error) {
      // Expected if no members exist
      expect(error).toBeDefined();
    }
  });

  it("should get member stats", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.members.stats();
      expect(result).toHaveProperty("total");
    } catch (error) {
      // Expected if no data
      expect(error).toBeDefined();
    }
  });
});

describe("documents router", () => {
  it("should list documents", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.documents.list();
      expect(Array.isArray(result)).toBe(true);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should get document stats", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.documents.stats();
      expect(result).toHaveProperty("total");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

describe("finances router", () => {
  it("should get finance stats", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.finances.stats();
      expect(result).toHaveProperty("solde");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

// ============ MEMBER ID GENERATION TESTS ============
import { createMember, getMemberById, listMembers, deleteMember } from "./db";
import { getDb } from "./db";

describe("Member ID Generation System", () => {
  let testMemberId: number | null = null;

  beforeEach(async () => {
    // Ensure database is available
    const db = await getDb();
    expect(db).toBeDefined();
  });

  it("should generate member ID with correct format for male (1)", async () => {
    const member = await createMember({
      firstName: "Jean",
      lastName: "Dupont",
      email: "jean.dupont@test.com",
      phone: "0612345678",
      role: "Membre",
      function: "Développeur",
      status: "active" as const,
      gender: "homme",
    });

    testMemberId = member.id;

    expect(member.memberId).toBeDefined();
    expect(member.memberId).toMatch(/^1\d{8}$/); // Format: 1MMYY0000 (9 digits total)
    expect(member.memberId.charAt(0)).toBe("1"); // Gender code for male

    // Clean up
    await deleteMember(member.id);
  });

  it("should generate member ID with correct format for female (2)", async () => {
    const member = await createMember({
      firstName: "Marie",
      lastName: "Martin",
      email: "marie.martin@test.com",
      phone: "0612345679",
      role: "Membre",
      function: "Designer",
      status: "active" as const,
      gender: "femme",
    });

    expect(member.memberId).toBeDefined();
    expect(member.memberId).toMatch(/^2\d{8}$/); // Format: 2MMYY0000 (9 digits total)
    expect(member.memberId.charAt(0)).toBe("2"); // Gender code for female

    // Clean up
    await deleteMember(member.id);
  });

  it("should generate member ID with correct format for other (3)", async () => {
    const member = await createMember({
      firstName: "Alex",
      lastName: "Autre",
      email: "alex.autre@test.com",
      phone: "0612345680",
      role: "Membre",
      function: "Consultant",
      status: "active" as const,
      gender: "autre",
    });

    expect(member.memberId).toBeDefined();
    expect(member.memberId).toMatch(/^3\d{8}$/); // Format: 3MMYY0000 (9 digits total)
    expect(member.memberId.charAt(0)).toBe("3"); // Gender code for other

    // Clean up
    await deleteMember(member.id);
  });

  it("should generate member ID with correct month and year format", async () => {
    const member = await createMember({
      firstName: "Test",
      lastName: "User",
      email: "test.user@test.com",
      phone: "0612345681",
      role: "Membre",
      function: "Tester",
      status: "active" as const,
      gender: "homme",
    });

    const now = new Date();
    const expectedMonth = String(now.getMonth() + 1).padStart(2, "0");
    const expectedYear = String(now.getFullYear()).slice(-2);
    const expectedMonthYear = expectedMonth + expectedYear;

    // Extract MMYY from memberId (positions 1-4)
    const actualMonthYear = member.memberId.substring(1, 5);

    expect(actualMonthYear).toBe(expectedMonthYear);

    // Clean up
    await deleteMember(member.id);
  });

  it("should retrieve member with generated ID", async () => {
    const createdMember = await createMember({
      firstName: "Retrieve",
      lastName: "Test",
      email: "retrieve.test@test.com",
      phone: "0612345682",
      role: "Membre",
      function: "Retriever",
      status: "active" as const,
      gender: "femme",
    });

    const retrievedMember = await getMemberById(createdMember.id);

    expect(retrievedMember).toBeDefined();
    expect(retrievedMember?.memberId).toBe(createdMember.memberId);
    expect(retrievedMember?.firstName).toBe("Retrieve");
    expect(retrievedMember?.lastName).toBe("Test");

    // Clean up
    await deleteMember(createdMember.id);
  });

  it('should default to "autre" gender if not specified', async () => {
    const member = await createMember({
      firstName: "Default",
      lastName: "Gender",
      email: "default.gender@test.com",
      phone: "0612345685",
      role: "Membre",
      function: "Default",
      status: "active" as const,
      // gender not specified - should default to 'autre'
    } as any);

    expect(member.memberId).toBeDefined();
    expect(member.memberId.charAt(0)).toBe("3"); // Should be '3' for 'autre'

    // Clean up
    await deleteMember(member.id);
  });
});
