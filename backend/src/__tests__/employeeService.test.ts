import { describe, it, expect, beforeEach } from "vitest";
import type Database from "better-sqlite3";
import { createTestDb } from "./testDb";
import { EmployeeService, NotFoundError, ConflictError } from "../services/employeeService";

const validInput = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@acme.com",
  department: "Engineering",
  jobTitle: "Senior Software Engineer",
  level: "L4",
  country: "GB",
  employmentType: "FULL_TIME" as const,
  status: "ACTIVE" as const,
  hireDate: "2024-01-15",
  baseSalaryAnnual: 95000,
  changedBy: "HR Manager",
};

describe("EmployeeService", () => {
  let db: Database.Database;
  let service: EmployeeService;

  beforeEach(() => {
    db = createTestDb();
    service = new EmployeeService(db);
  });

  describe("create", () => {
    it("creates an employee with a generated employee code", () => {
      const created = service.create(validInput);
      expect(created.employeeCode).toMatch(/^EMP-\d{6}$/);
    });

    it("resolves countryName from the country code", () => {
      const created = service.create(validInput);
      expect(created.countryName).toBe("United Kingdom");
    });

    it("copies baseSalaryAnnual into baseSalaryAnnualUsd unchanged (single-currency v1)", () => {
      const created = service.create(validInput);
      expect(created.currency).toBe("USD");
      expect(created.baseSalaryAnnualUsd).toBe(95000);
    });

    it("throws ConflictError when the email is already in use", () => {
      service.create(validInput);
      expect(() => service.create({ ...validInput, firstName: "Someone Else" })).toThrow(ConflictError);
    });
  });

  describe("getById", () => {
    it("returns the employee when found", () => {
      const created = service.create(validInput);
      expect(service.getById(created.id).id).toBe(created.id);
    });

    it("throws NotFoundError when the id doesn't exist", () => {
      expect(() => service.getById("does-not-exist")).toThrow(NotFoundError);
    });
  });

  describe("update", () => {
    it("updates a field and preserves untouched fields", () => {
      const created = service.create(validInput);
      const updated = service.update(created.id, { jobTitle: "Staff Engineer" });
      expect(updated.jobTitle).toBe("Staff Engineer");
      expect(updated.email).toBe(created.email);
    });

    it("keeps baseSalaryAnnualUsd in sync when baseSalaryAnnual changes", () => {
      const created = service.create(validInput);
      const updated = service.update(created.id, { baseSalaryAnnual: 105000 });
      expect(updated.baseSalaryAnnualUsd).toBe(105000);
    });

    it("throws NotFoundError for an unknown id", () => {
      expect(() => service.update("does-not-exist", { jobTitle: "X" })).toThrow(NotFoundError);
    });

    it("throws ConflictError when updating to an email already used by someone else", () => {
      service.create(validInput);
      const second = service.create({ ...validInput, email: "grace@acme.com" });
      expect(() => service.update(second.id, { email: "ada@acme.com" })).toThrow(ConflictError);
    });

    it("allows updating an employee to keep their own existing email", () => {
      const created = service.create(validInput);
      expect(() => service.update(created.id, { email: "ada@acme.com" })).not.toThrow();
    });
  });

  describe("deactivate", () => {
    it("sets status to INACTIVE without deleting the row", () => {
      const created = service.create(validInput);
      const deactivated = service.deactivate(created.id);
      expect(deactivated.status).toBe("INACTIVE");
      expect(service.getById(created.id).status).toBe("INACTIVE");
    });

    it("throws NotFoundError for an unknown id", () => {
      expect(() => service.deactivate("does-not-exist")).toThrow(NotFoundError);
    });
  });
  describe("EmployeeService — salary history", () => {
  let db: Database.Database;
  let service: EmployeeService;

  beforeEach(() => {
    db = createTestDb();
    service = new EmployeeService(db);
  });

  it("writes exactly one INITIAL_HIRE history record on create", () => {
    const created = service.create(validInput);
    const history = service.getSalaryHistory(created.id);
    expect(history).toHaveLength(1);
    expect(history[0].changeReason).toBe("INITIAL_HIRE");
    expect(history[0].previousSalary).toBeNull();
    expect(history[0].newSalary).toBe(95000);
  });

  it("writes a new history record when salary changes on update", () => {
    const created = service.create(validInput);
    service.update(created.id, {
      baseSalaryAnnual: 105000,
      changeReason: "MERIT_INCREASE",
      changedBy: "Jane HR",
    });
    const history = service.getSalaryHistory(created.id);
    expect(history).toHaveLength(2);
    expect(history[0].changeReason).toBe("MERIT_INCREASE");
    expect(history[0].previousSalary).toBe(95000);
    expect(history[0].newSalary).toBe(105000);
    expect(history[0].changedBy).toBe("Jane HR");
  });

  it("does NOT write a history record when salary is unchanged", () => {
    const created = service.create(validInput);
    service.update(created.id, { jobTitle: "Staff Engineer" });
    const history = service.getSalaryHistory(created.id);
    expect(history).toHaveLength(1); // still just the INITIAL_HIRE record
  });

  it("defaults changeReason to CORRECTION when salary changes without a reason given", () => {
    const created = service.create(validInput);
    service.update(created.id, { baseSalaryAnnual: 96000 });
    const history = service.getSalaryHistory(created.id);
    expect(history[0].changeReason).toBe("CORRECTION");
  });

  it("throws NotFoundError when getting history for an unknown employee", () => {
    expect(() => service.getSalaryHistory("does-not-exist")).toThrow(NotFoundError);
  });
});
});