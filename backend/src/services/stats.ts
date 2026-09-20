/**
 * Pure aggregation math for the analytics endpoints. No DB/HTTP coupling, so it's
 * tested directly against plain arrays — this is the module doing the actual "how
 * do we pay people" calculation.
 */

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return round2(values.reduce((acc, v) => acc + v, 0) / values.length);
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return round2(value);
}

export function min(values: number[]): number {
  if (values.length === 0) return 0;
  return round2(Math.min(...values));
}

export function max(values: number[]): number {
  if (values.length === 0) return 0;
  return round2(Math.max(...values));
}

export function sum(values: number[]): number {
  return round2(values.reduce((acc, v) => acc + v, 0));
}

export interface GroupStats {
  key: string;
  headcount: number;
  totalUsd: number;
  averageUsd: number;
  medianUsd: number;
  minUsd: number;
  maxUsd: number;
}

/** Groups rows by an arbitrary key, computes stats per group, sorted by headcount desc. */
export function groupSalaryStats<T>(
  rows: T[],
  keyOf: (row: T) => string,
  salaryOf: (row: T) => number,
): GroupStats[] {
  const groups = new Map<string, number[]>();
  for (const row of rows) {
    const key = keyOf(row);
    const salary = salaryOf(row);
    const bucket = groups.get(key);
    if (bucket) bucket.push(salary);
    else groups.set(key, [salary]);
  }

  return Array.from(groups.entries())
    .map(([key, salaries]) => ({
      key,
      headcount: salaries.length,
      totalUsd: sum(salaries),
      averageUsd: mean(salaries),
      medianUsd: median(salaries),
      minUsd: min(salaries),
      maxUsd: max(salaries),
    }))
    .sort((a, b) => b.headcount - a.headcount);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}