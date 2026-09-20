export const DEPARTMENTS = [
  "Engineering", "Product", "Design", "Sales", "Marketing",
  "Customer Support", "Finance", "Human Resources", "Operations", "Legal",
] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const LEVELS = ["L1", "L2", "L3", "L4", "L5", "L6"] as const;
export type Level = (typeof LEVELS)[number];

export const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT"] as const;
export const EMPLOYEE_STATUSES = ["ACTIVE", "INACTIVE"] as const;

export const SALARY_CHANGE_REASONS = [
  "INITIAL_HIRE", "MERIT_INCREASE", "PROMOTION", "MARKET_ADJUSTMENT", "CORRECTION",
] as const;

/**
 * Countries ACME operates in. The schema carries a `currency` column and a
 * `base_salary_annual_usd` column to support real per-country pay later, but for v1
 * every employee is paid in a single currency (USD) — see requirements.md. This keeps
 * the door open for real multi-currency without a future migration, while not building
 * FX conversion logic the brief never asked for.
 */
export const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "IN", name: "India" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "SG", name: "Singapore" },
  { code: "BR", name: "Brazil" },
] as const;

export const DEFAULT_CURRENCY = "USD";

export function findCountry(code: string) {
  const country = COUNTRIES.find((c) => c.code === code);
  if (!country) throw new Error(`Unknown country code: ${code}`);
  return country;
}