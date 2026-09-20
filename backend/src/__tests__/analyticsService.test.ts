import { describe, it, expect, beforeEach } from "vitest";
import type Database from "better-sqlite3";
import { createTestDb } from "./testDb";
import { EmployeeService } from "../services/employeeService";
import { AnalyticsService } from "../services/analyticsService";

const baseInput = {
  firstName: "A", lastName: "B", department: "Engineering", jobTitle: "SWE",
  level: "L4", country: "US", hireDate: "2024-01-01", employmentType: "FULL_TIME" as const,
  status: "ACTIVE" as const,
  changedBy: "HR Manager", baseSalaryAnnual: 100_000,
};

describe("AnalyticsService", () => {
  let db: Database.Database;
  let employees: EmployeeService;
  let analytics: AnalyticsService;

  beforeEach(() => {
    db = createTestDb();
    employees = new EmployeeService(db);
    analytics = new AnalyticsService(db);
  });

  describe("summary", () => {
    it("reports zero headcount and zero payroll when there are no employees", () => {
      const summary = analytics.summary();
      expect(summary.activeHeadcount).toBe(0);
      expect(summary.totalAnnualPayrollUsd).toBe(0);
    });

    it("aggregates headcount and payroll across active employees only", () => {
      employees.create({ ...baseInput, email: "a@acme.com", baseSalaryAnnual: 100_000 });
      const toDeactivate = employees.create({ ...baseInput, email: "b@acme.com", baseSalaryAnnual: 200_000 });
      employees.deactivate(toDeactivate.id);

      const summary = analytics.summary();
      expect(summary.activeHeadcount).toBe(1);
      expect(summary.totalAnnualPayrollUsd).toBe(100_000);
      expect(summary.averageSalaryUsd).toBe(100_000);
    });
  });

  describe("byDepartment", () => {
    it("groups active employees by department", () => {
      employees.create({ ...baseInput, email: "a@acme.com", department: "Engineering", baseSalaryAnnual: 100_000 });
      employees.create({ ...baseInput, email: "b@acme.com", department: "Sales", baseSalaryAnnual: 80_000 });

      const result = analytics.byDepartment();
      expect(result.find((g) => g.key === "Engineering")?.headcount).toBe(1);
      expect(result.find((g) => g.key === "Sales")?.headcount).toBe(1);
    });
  });

  describe("byCountry", () => {
    it("groups active employees by country", () => {
      employees.create({ ...baseInput, email: "a@acme.com", country: "US", baseSalaryAnnual: 100_000 });
      employees.create({ ...baseInput, email: "b@acme.com", country: "GB", baseSalaryAnnual: 90_000 });

      const result = analytics.byCountry();
      expect(result.map((g) => g.key)).toEqual(expect.arrayContaining([
        expect.stringContaining("United States"),
        expect.stringContaining("United Kingdom"),
      ]));
    });
  });

  describe("byLevel", () => {
    it("groups active employees by level", () => {
      employees.create({ ...baseInput, email: "a@acme.com", level: "L4", baseSalaryAnnual: 100_000 });
      employees.create({ ...baseInput, email: "b@acme.com", level: "L2", baseSalaryAnnual: 60_000 });

      const result = analytics.byLevel();
      expect(result.find((g) => g.key === "L4")?.averageUsd).toBe(100_000);
      expect(result.find((g) => g.key === "L2")?.averageUsd).toBe(60_000);
    });
  });
});