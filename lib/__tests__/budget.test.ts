import { describe, expect, it } from "vitest";
import { allocate, boostWeights, buildBudget, normalizeWeights } from "../budget";
import { KIND_META } from "../catalog";

describe("allocate", () => {
  it("adds back up to the exact total, including awkward amounts", () => {
    const weights = { a: 0.333, b: 0.333, c: 0.334 };
    for (const total of [0.01, 1, 99.99, 1000, 12345.67]) {
      const parts = allocate(total, weights);
      const sum = Object.values(parts).reduce((acc, value) => acc + value, 0);
      expect(sum).toBeCloseTo(total, 2);
    }
  });

  it("gives the leftover cent to one line instead of dropping it", () => {
    const parts = allocate(100, { a: 1 / 3, b: 1 / 3, c: 1 / 3 });
    expect(Object.values(parts)).toEqual([33.34, 33.33, 33.33]);
    expect(Object.values(parts).reduce((sum, value) => sum + value, 0)).toBeCloseTo(100, 2);
  });

  it("returns nothing for an empty or zero allocation", () => {
    expect(allocate(100, {})).toEqual({});
    expect(allocate(0, { a: 1 })).toEqual({});
  });
});

describe("boostWeights", () => {
  it("normalizes to one and keeps the contingency floor", () => {
    const weights = boostWeights("wedding", ["catering", "photography"]);
    const sum = Object.values(weights).reduce((acc, weight) => acc + weight, 0);
    expect(sum).toBeCloseTo(1, 6);
    expect(weights.contingency ?? 0).toBeGreaterThanOrEqual(0.05);
  });

  it("moves weight toward the chosen priorities", () => {
    const base = boostWeights("birthday", []);
    const boosted = boostWeights("birthday", ["entertainment"]);
    expect(boosted.entertainment ?? 0).toBeGreaterThan(base.entertainment ?? 0);
    expect(boosted.food ?? 0).toBeLessThan(base.food ?? 0);
  });

  it("ignores keys that do not belong to the event type", () => {
    const weights = boostWeights("community", ["catering", "nonsense"]);
    expect(weights.catering).toBeUndefined();
    expect(Object.keys(weights).sort()).toEqual(
      KIND_META.community.categories.map((category) => category.key).sort(),
    );
  });

  it("normalizes arbitrary overrides without losing categories", () => {
    const normalized = normalizeWeights({ a: 2, b: 2, c: -5, d: 0 });
    expect(normalized).toEqual({ a: 0.5, b: 0.5 });
  });
});

describe("buildBudget", () => {
  it("produces one line per category with a matching total", () => {
    const budget = buildBudget("wedding", 250_000, 80, ["catering"]);
    expect(budget.lines).toHaveLength(KIND_META.wedding.categories.length);
    const sum = budget.lines.reduce((acc, line) => acc + line.amount, 0);
    expect(sum).toBeCloseTo(250_000, 2);
    expect(budget.total).toBeCloseTo(250_000, 2);
    expect(budget.perGuest).toBeCloseTo(3125, 2);
  });

  it("keeps the printed shares at one hundred percent", () => {
    const budget = buildBudget("community", 1_000_000, 300, []);
    const shares = budget.lines.reduce((acc, line) => acc + line.share, 0);
    expect(shares).toBeCloseTo(1, 6);
  });

  it("applies notes to the matching line and falls back to the hint", () => {
    const budget = buildBudget("birthday", 50_000, 30, [], { cake: "Two small cakes, one gluten-free." });
    expect(budget.lines.find((line) => line.key === "cake")?.note).toBe("Two small cakes, one gluten-free.");
    expect(budget.lines.find((line) => line.key === "food")?.note).toContain("Catering");
  });
});
