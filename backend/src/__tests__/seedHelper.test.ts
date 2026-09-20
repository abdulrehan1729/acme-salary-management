import { describe, it, expect } from "vitest";
import { weightedPick, salaryForLevel } from "../db/seedHelpers";

describe("weightedPick", () => {
  it("always returns one of the provided keys", () => {
    const weights = { A: 0.5, B: 0.3, C: 0.2 };
    for (let i = 0; i < 50; i++) {
      expect(Object.keys(weights)).toContain(weightedPick(weights));
    }
  });

  it("returns the only key when weights has a single entry", () => {
    expect(weightedPick({ Solo: 1 })).toBe("Solo");
  });

  it("roughly respects weighting over a large sample", () => {
    const weights = { Common: 0.9, Rare: 0.1 };
    const counts = { Common: 0, Rare: 0 };
    for (let i = 0; i < 2000; i++) {
      counts[weightedPick(weights) as keyof typeof counts]++;
    }
    // Not asserting an exact ratio (it's random) — just that the skew is in the right direction.
    expect(counts.Common).toBeGreaterThan(counts.Rare * 3);
  });
});

describe("salaryForLevel", () => {
  it("returns a value within the level's configured band", () => {
    const salary = salaryForLevel("L1");
    expect(salary).toBeGreaterThanOrEqual(45_000);
    expect(salary).toBeLessThanOrEqual(60_000);
  });

  it("higher levels produce higher bands than lower levels (band floors are increasing)", () => {
    const l1 = salaryForLevel("L1");
    const l6 = salaryForLevel("L6");
    expect(l6).toBeGreaterThan(l1);
  });

  it("rounds to the nearest 100", () => {
    const salary = salaryForLevel("L3");
    expect(salary % 100).toBe(0);
  });
});