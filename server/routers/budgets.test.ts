import { describe, it, expect } from "vitest";

describe("Budgets Router - Amount Cleaning", () => {
  // Fonction de nettoyage des montants (copiée du routeur)
  const cleanAmount = (value: any): number => {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      // Extraire tous les nombres décimaux (ex: 1000.00, 200.00, etc.)
      const matches = value.match(/\d+\.\d{2}/g);
      if (matches && matches.length > 0) {
        return matches.reduce((sum, m) => sum + parseFloat(m), 0);
      }
      return parseFloat(value) || 0;
    }
    return 0;
  };

  it("should handle normal numeric values", () => {
    expect(cleanAmount(1000)).toBe(1000);
    expect(cleanAmount(1000.5)).toBe(1000.5);
    expect(cleanAmount(0)).toBe(0);
  });

  it("should handle normal string numeric values", () => {
    expect(cleanAmount("1000.00")).toBe(1000);
    expect(cleanAmount("1000.50")).toBe(1000.5);
    expect(cleanAmount("0.00")).toBe(0);
  });

  it("should extract and sum concatenated amounts", () => {
    // Cas du problème original : montants concaténés
    expect(cleanAmount("01000.00200.00100000.00100.0050000.00")).toBe(
      1000 + 200 + 100000 + 100 + 50000
    );
    expect(cleanAmount("01000.00200.00100000.00100.0050000.00")).toBe(151300);
  });

  it("should handle multiple concatenated amounts", () => {
    expect(cleanAmount("1000.00")).toBe(1000);
    expect(cleanAmount("1000.002000.00")).toBe(3000);
    expect(cleanAmount("500.00250.00250.00")).toBe(1000);
  });

  it("should handle edge cases", () => {
    expect(cleanAmount("")).toBe(0);
    expect(cleanAmount(null)).toBe(0);
    expect(cleanAmount(undefined)).toBe(0);
    expect(cleanAmount("abc")).toBe(0);
    expect(cleanAmount("1000")).toBe(1000); // Fallback to parseFloat
  });

  it("should handle mixed formats", () => {
    expect(cleanAmount("1000.00")).toBe(1000);
    expect(cleanAmount("1000")).toBe(1000); // Fallback to parseFloat
    expect(cleanAmount("1000.5")).toBe(1000.5); // Fallback to parseFloat
  });

  it("should sum budget amounts correctly", () => {
    const budgets = [
      { totalAmount: "01000.00200.00100000.00100.0050000.00" },
      { totalAmount: 5000 },
      { totalAmount: "2000.00" },
    ];

    const total = budgets.reduce(
      (sum, b) => sum + cleanAmount(b.totalAmount),
      0
    );

    expect(total).toBe(151300 + 5000 + 2000);
    expect(total).toBe(158300);
  });

  it("should format correctly with toLocaleString", () => {
    const amount = cleanAmount("01000.00200.00100000.00100.0050000.00");
    const formatted = amount.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // Accepter l'espace insecable (U+202F) utilise par JavaScript
    expect(formatted).toMatch(/151\s300,00/);
  });

  it("should handle budget list with mixed amounts", () => {
    const budgets = [
      { id: 1, name: "Budget 1", totalAmount: "1000.00" },
      { id: 2, name: "Budget 2", totalAmount: 2000 },
      { id: 3, name: "Budget 3", totalAmount: "01000.00200.00" },
    ];

    const totalBudget = budgets.reduce(
      (sum: number, b: any) => sum + cleanAmount(b.totalAmount),
      0
    );

    // 1000 + 2000 + (1000 + 200) = 4200
    expect(totalBudget).toBe(4200);
  });

  it("should handle empty budget array", () => {
    const budgets: any[] = [];

    const totalBudget = budgets.reduce(
      (sum: number, b: any) => sum + cleanAmount(b.totalAmount),
      0
    );

    expect(totalBudget).toBe(0);
  });

  it("should handle null or undefined amounts", () => {
    const budgets = [
      { id: 1, name: "Budget 1", totalAmount: "1000.00" },
      { id: 2, name: "Budget 2", totalAmount: null },
      { id: 3, name: "Budget 3", totalAmount: undefined },
    ];

    const totalBudget = budgets.reduce(
      (sum: number, b: any) => sum + cleanAmount(b.totalAmount),
      0
    );

    expect(totalBudget).toBe(1000);
  });
});
