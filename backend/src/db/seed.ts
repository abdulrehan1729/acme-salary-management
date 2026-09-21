/**
 * Seeds the database with 10,000 employees across every department/level/country,
 * with a manager hierarchy and one INITIAL_HIRE salary-history record each.
 *
 * seedDatabase(db) does the actual work and is safe to call from application code
 * (e.g. on server boot via seedIfEmpty). The CLI entry point at the bottom preserves
 * `npm run seed` for local force-reseeding.
 */
import { faker } from "@faker-js/faker";
import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { getDb } from "./connection";
import { runMigrations } from "./migrate";
import { DEPARTMENTS, LEVELS, COUNTRIES, DEFAULT_CURRENCY } from "../utils/lookups";
import { weightedPick, salaryForLevel } from "./seedHelpers";

const TOTAL_EMPLOYEES = 10_000;
const SEED = 42;

const DEPARTMENT_WEIGHTS: Record<(typeof DEPARTMENTS)[number], number> = {
  Engineering: 0.32, Product: 0.07, Design: 0.05, Sales: 0.16, Marketing: 0.08,
  "Customer Support": 0.14, Finance: 0.05, "Human Resources": 0.04, Operations: 0.07, Legal: 0.02,
};

const LEVEL_WEIGHTS: Record<(typeof LEVELS)[number], number> = {
  L1: 0.22, L2: 0.28, L3: 0.24, L4: 0.15, L5: 0.08, L6: 0.03,
};

const COUNTRY_WEIGHTS: Record<string, number> = {
  US: 0.35, IN: 0.25, GB: 0.12, DE: 0.1, CA: 0.08, SG: 0.04, AU: 0.04, BR: 0.02,
};

const JOB_TITLES: Record<(typeof DEPARTMENTS)[number], string[]> = {
  Engineering: ["Software Engineer", "Senior Software Engineer", "Staff Engineer", "Engineering Manager", "QA Engineer", "DevOps Engineer"],
  Product: ["Product Manager", "Senior Product Manager", "Product Analyst", "Director of Product"],
  Design: ["Product Designer", "UX Researcher", "Design Lead", "Visual Designer"],
  Sales: ["Account Executive", "Sales Development Rep", "Sales Manager", "VP of Sales"],
  Marketing: ["Marketing Manager", "Content Strategist", "Growth Marketer", "Brand Manager"],
  "Customer Support": ["Support Specialist", "Support Team Lead", "Customer Success Manager"],
  Finance: ["Financial Analyst", "Accountant", "Finance Manager", "Controller"],
  "Human Resources": ["HR Business Partner", "Recruiter", "HR Manager", "People Operations Specialist"],
  Operations: ["Operations Analyst", "Operations Manager", "Business Operations Lead"],
  Legal: ["Corporate Counsel", "Legal Analyst", "Compliance Manager"],
};

type PlannedEmployee = {
  id: string;
  department: (typeof DEPARTMENTS)[number];
  level: (typeof LEVELS)[number];
  country: string;
};

/** Seeds `db` with 10,000 employees. Always clears existing data first — callers decide
 *  when it's safe to call this (see seedIfEmpty below for the guarded wrapper). */
export async function seedDatabase(db: Database.Database): Promise<void> {
  faker.seed(SEED);

  console.log("Clearing existing data...");
  db.exec("DELETE FROM salary_history; DELETE FROM employees;");

  const insertEmployee = db.prepare(`INSERT INTO employees (
    id, employee_code, first_name, last_name, email, department, job_title, level,
    country, country_name, currency, employment_type, status, manager_id, hire_date,
    base_salary_annual, base_salary_annual_usd
  ) VALUES (
    @id, @employee_code, @first_name, @last_name, @email, @department, @job_title, @level,
    @country, @country_name, @currency, @employment_type, @status, @manager_id, @hire_date,
    @base_salary_annual, @base_salary_annual_usd
  )`);

  const insertHistory = db.prepare(`INSERT INTO salary_history (
    id, employee_id, previous_salary, new_salary, currency, change_reason, effective_date, changed_by
  ) VALUES (
    @id, @employee_id, NULL, @new_salary, @currency, 'INITIAL_HIRE', @effective_date, 'Seed Script'
  )`);

  console.log(`Generating ${TOTAL_EMPLOYEES} employees...`);

  // Pass 1: decide dept/level/country for everyone up front, so we can wire a manager
  // hierarchy (an L(n) employee reports to an L(n+1) in the same dept/country when one
  // exists, otherwise has no manager).
  const planned: PlannedEmployee[] = [];
  for (let i = 0; i < TOTAL_EMPLOYEES; i++) {
    planned.push({
      id: randomUUID(),
      department: weightedPick(DEPARTMENT_WEIGHTS),
      level: weightedPick(LEVEL_WEIGHTS),
      country: weightedPick(COUNTRY_WEIGHTS),
    });
  }

  const byDeptCountryLevel = new Map<string, string[]>();
  const keyOf = (p: PlannedEmployee) => `${p.department}|${p.country}|${p.level}`;
  for (const p of planned) {
    const key = keyOf(p);
    const arr = byDeptCountryLevel.get(key);
    if (arr) arr.push(p.id);
    else byDeptCountryLevel.set(key, [p.id]);
  }

  const insertMany = db.transaction((rows: PlannedEmployee[]) => {
    db.pragma("defer_foreign_keys = ON");
    const usedEmails = new Set<string>();

    rows.forEach((plan, index) => {
      const levelIndex = LEVELS.indexOf(plan.level);
      const managerLevel = levelIndex < LEVELS.length - 1 ? LEVELS[levelIndex + 1] : undefined;
      const managerCandidates = managerLevel
        ? byDeptCountryLevel.get(`${plan.department}|${plan.country}|${managerLevel}`)
        : undefined;
      const managerId =
        managerCandidates && managerCandidates.length > 0
          ? managerCandidates[Math.floor(Math.random() * managerCandidates.length)]
          : null;

      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      let email = `${firstName}.${lastName}@acme.com`.toLowerCase().replace(/[^a-z.@]/g, "");
      while (usedEmails.has(email)) {
        email = `${firstName}.${lastName}${faker.number.int({ min: 1, max: 999 })}@acme.com`
          .toLowerCase().replace(/[^a-z0-9.@]/g, "");
      }
      usedEmails.add(email);

      const country = COUNTRIES.find((c) => c.code === plan.country)!;
      const titles = JOB_TITLES[plan.department];
      const jobTitle = titles[Math.min(levelIndex, titles.length - 1)];
      const hireDate = faker.date.past({ years: 8 }).toISOString().slice(0, 10);
      const salary = salaryForLevel(plan.level);
      const employeeCode = `EMP-${String(index + 1).padStart(6, "0")}`;
      const employmentType = Math.random() < 0.92 ? "FULL_TIME" : faker.helpers.arrayElement(["PART_TIME", "CONTRACT"] as const);
      const status = Math.random() < 0.97 ? "ACTIVE" : "INACTIVE";

      insertEmployee.run({
        id: plan.id,
        employee_code: employeeCode,
        first_name: firstName,
        last_name: lastName,
        email,
        department: plan.department,
        job_title: jobTitle,
        level: plan.level,
        country: country.code,
        country_name: country.name,
        currency: DEFAULT_CURRENCY,
        employment_type: employmentType,
        status,
        manager_id: managerId,
        hire_date: hireDate,
        base_salary_annual: salary,
        base_salary_annual_usd: salary,
      });

      insertHistory.run({
        id: randomUUID(),
        employee_id: plan.id,
        new_salary: salary,
        currency: DEFAULT_CURRENCY,
        effective_date: hireDate,
      });

      if ((index + 1) % 1000 === 0) console.log(`  ...${index + 1}/${TOTAL_EMPLOYEES}`);
    });
  });

  insertMany(planned);

  const count = (db.prepare("SELECT COUNT(*) AS c FROM employees").get() as { c: number }).c;
  console.log(`Done. ${count} employees seeded.`);
}

/** Safe for automatic use on server boot: only seeds if the table is currently empty,
 *  so it never wipes real data on a restart/redeploy. */
export async function seedIfEmpty(db: Database.Database): Promise<void> {
  const { c } = db.prepare("SELECT COUNT(*) AS c FROM employees").get() as { c: number };
  if (c > 0) {
    console.log(`Database already has ${c} employees — skipping seed.`);
    return;
  }
  console.log("Database is empty — seeding...");
  await seedDatabase(db);
}

// CLI entry point — `npm run seed` force-reseeds regardless of current row count.
if (require.main === module) {
  const db = getDb();
  runMigrations(db);
  seedDatabase(db).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}