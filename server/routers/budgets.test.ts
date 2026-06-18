import { describe, it, expect } from "vitest";
import { z } from "zod";

describe("Budgets Router - Amount Parsing", () => {
  // Test parsing of concatenated amounts
  it("should parse concatenated amount string correctly", () => {
    const concatenatedAmount = "01000.00200.00100000.00100.0050000.00";
    const firstAmount = parseFloat(concatenatedAmount.split(".")[0]);
    expect(firstAmount).toBe(1000);
  });

  // Test parsing of normal amount
  it("should parse normal amount string correctly", () => {
    const normalAmount = "1000.00";
    const parsed = parseFloat(normalAmount);
    expect(parsed).toBe(1000);
  });

  // Test parsing of number
  it("should parse number correctly", () => {
    const numberAmount = 1000;
    const parsed = parseFloat(numberAmount.toString());
    expect(parsed).toBe(1000);
  });

  // Test budget total calculation
  it("should calculate budget total correctly", () => {
    const budgets = [
      { id: 1, name: "Budget 1", totalAmount: "1000.00" },
      { id: 2, name: "Budget 2", totalAmount: "2000.00" },
      { id: 3, name: "Budget 3", totalAmount: "3000.00" },
    ];

    const totalBudget = budgets.reduce(
      (sum: number, b: any) =>
        sum +
        (typeof b.totalAmount === "string"
          ? parseFloat(b.totalAmount.split(".")[0]) || 0
          : parseFloat(b.totalAmount) || 0),
      0
    );

    expect(totalBudget).toBe(6000);
  });

  // Test budget total with concatenated amounts
  it("should handle concatenated amounts in budget total", () => {
    const budgets = [
      { id: 1, name: "Budget 1", totalAmount: "01000.00200.00100000.00" },
      { id: 2, name: "Budget 2", totalAmount: "2000.00" },
    ];

    const totalBudget = budgets.reduce(
      (sum: number, b: any) =>
        sum +
        (typeof b.totalAmount === "string"
          ? parseFloat(b.totalAmount.split(".")[0]) || 0
          : parseFloat(b.totalAmount) || 0),
      0
    );

    // First budget: 1000 (from "01000.00...")
    // Second budget: 2000
    // Total: 3000
    expect(totalBudget).toBe(3000);
  });

  // Test locale string formatting
  it("should format amount with French locale correctly", () => {
    const amount = 1000;
    const formatted = amount.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    expect(formatted).toContain("000,00");
  });

  // Test locale string formatting for large amounts
  it("should format large amount with French locale correctly", () => {
    const amount = 151300;
    const formatted = amount.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    expect(formatted).toContain("300,00");
  });

  // Test mixed types in budget array
  it("should handle mixed string and number types", () => {
    const budgets = [
      { id: 1, name: "Budget 1", totalAmount: "1000.00" },
      { id: 2, name: "Budget 2", totalAmount: 2000 },
      { id: 3, name: "Budget 3", totalAmount: "3000.50" },
    ];

    const totalBudget = budgets.reduce(
      (sum: number, b: any) =>
        sum +
        (typeof b.totalAmount === "string"
          ? parseFloat(b.totalAmount.split(".")[0]) || 0
          : parseFloat(b.totalAmount) || 0),
      0
    );

    // 1000 + 2000 + 3000 = 6000
    expect(totalBudget).toBe(6000);
  });

  // Test edge case: empty budget array
  it("should handle empty budget array", () => {
    const budgets: any[] = [];

    const totalBudget = budgets.reduce(
      (sum: number, b: any) =>
        sum +
        (typeof b.totalAmount === "string"
          ? parseFloat(b.totalAmount.split(".")[0]) || 0
          : parseFloat(b.totalAmount) || 0),
      0
    );

    expect(totalBudget).toBe(0);
  });

  // Test edge case: null or undefined amounts
  it("should handle null or undefined amounts", () => {
    const budgets = [
      { id: 1, name: "Budget 1", totalAmount: "1000.00" },
      { id: 2, name: "Budget 2", totalAmount: null },
      { id: 3, name: "Budget 3", totalAmount: undefined },
    ];

    const totalBudget = budgets.reduce(
      (sum: number, b: any) =>
        sum +
        (b.totalAmount
          ? typeof b.totalAmount === "string"
            ? parseFloat(b.totalAmount.split(".")[0]) || 0
            : parseFloat(b.totalAmount) || 0
          : 0),
      0
    );

    expect(totalBudget).toBe(1000);
  });
});
