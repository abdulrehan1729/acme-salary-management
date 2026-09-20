import { faker } from "@faker-js/faker";
import { LEVELS } from "../utils/lookups";

/** Picks one key from a weight map, roughly proportional to its weight. Weights should sum to ~1. */
export function weightedPick<T extends string>(weights: Record<T, number>): T {
  const r = Math.random();
  let acc = 0;
  for (const [key, weight] of Object.entries(weights) as [T, number][]) {
    acc += weight;
    if (r <= acc) return key;
  }
  return Object.keys(weights)[0] as T;
}

// USD annual salary bands per level — illustrative seed data, not a real comp model.
const LEVEL_BAND: Record<(typeof LEVELS)[number], [number, number]> = {
  L1: [45_000, 60_000],
  L2: [60_000, 80_000],
  L3: [80_000, 110_000],
  L4: [110_000, 150_000],
  L5: [150_000, 200_000],
  L6: [200_000, 280_000],
};

/** Random salary within the given level's band, rounded to the nearest 100. */
export function salaryForLevel(level: (typeof LEVELS)[number]): number {
  const [lo, hi] = LEVEL_BAND[level];
  const raw = faker.number.int({ min: lo, max: hi });
  return Math.round(raw / 100) * 100;
}