import { describe, it, expect } from "vitest";
import { mean, median, min, max, sum, groupSalaryStats } from "../services/stats";

describe("mean", () => {
  it("returns 0 for an empty array", () => {
    expect(mean([])).toBe(0);
  });

  it("averages a set of values", () => {
    expect(mean([10, 20, 30])).toBe(20);
  });

  it("rounds to 2 decimal places", () => {
    expect(mean([10, 11, 11])).toBe(10.67);
  });
});

describe("median", () => {
  it("returns 0 for an empty array", () => {
    expect(median([])).toBe(0);
  });

  it("returns the middle value for an odd-length array", () => {
    expect(median([5, 1, 3])).toBe(3);
  });

  it("averages the two middle values for an even-length array", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it("is unaffected by input order", () => {
    expect(median([100, 1, 50])).toBe(50);
  });

  it("does not mutate the input array", () => {
    const input = [3, 1, 2];
    median(input);
    expect(input).toEqual([3, 1, 2]);
  });
});

describe("min / max / sum", () => {
  it("min returns the smallest value", () => {
    expect(min([5, 1, 9])).toBe(1);
  });

  it("max returns the largest value", () => {
    expect(max([5, 1, 9])).toBe(9);
  });

  it("sum adds all values", () => {
    expect(sum([1.1, 2.2, 3.3])).toBe(6.6);
  });

  it("min/max/sum return 0 for empty arrays", () => {
    expect(min([])).toBe(0);
    expect(max([])).toBe(0);
    expect(sum([])).toBe(0);
  });
});

describe("groupSalaryStats", () => {
  const rows = [
    { dept: "Engineering", salary: 100_000 },
    { dept: "Engineering", salary: 120_000 },
    { dept: "Sales", salary: 80_000 },
  ];

  it("groups rows by key and computes per-group stats", () => {
    const result = groupSalaryStats(rows, (r) => r.dept, (r) => r.salary);
    const eng = result.find((g) => g.key === "Engineering")!;
    expect(eng.headcount).toBe(2);
    expect(eng.totalUsd).toBe(220_000);
    expect(eng.averageUsd).toBe(110_000);
    expect(eng.medianUsd).toBe(110_000);
    expect(eng.minUsd).toBe(100_000);
    expect(eng.maxUsd).toBe(120_000);
  });

  it("sorts groups by headcount descending", () => {
    const result = groupSalaryStats(rows, (r) => r.dept, (r) => r.salary);
    expect(result[0].key).toBe("Engineering");
    expect(result[1].key).toBe("Sales");
  });

  it("returns an empty array for no rows", () => {
    expect(groupSalaryStats([] as typeof rows, (r) => r.dept, (r) => r.salary)).toEqual([]);
  });
});