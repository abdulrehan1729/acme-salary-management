import { describe, it, expect, beforeEach } from "vitest";
import type Database from "better-sqlite3";
import { createTestDb } from "./testDb";
import { EmployeeRepository } from "../repositories/employeeRepository";
import { SalaryHistoryRepository } from "../repositories/salaryHistoryRepository";

describe("SalaryHistoryRepository", () => {
  let db: Database.Database;
  let employees: EmployeeRepository;
  let history: SalaryHistoryRepository;
  let employeeId: string;

  beforeEach(() => {
    db = createTestDb();
    employees = new EmployeeRepository(db);
    history = new SalaryHistoryRepository(db);
    const employee = employees.insert({
      employee_code: "EMP-000001",
      first_name: "Ada", last_name: "Lovelace", email: "ada@acme.com",
      department: "Engineering", job_title: "SWE", level: "L4",
      country: "GB", country_name: "United Kingdom", currency: "USD",
      employment_type: "FULL_TIME", status: "ACTIVE", manager_id: null,
      hire_date: "2024-01-15", base_salary_annual: 95000, base_salary_annual_usd: 95000,
    });
    employeeId = employee.id;
  });

  it("inserts a history record and finds it by employee", () => {
    history.insert({
      employee_id: employeeId, previous_salary: null, new_salary: 95000,
      currency: "USD", change_reason: "INITIAL_HIRE", effective_date: "2024-01-15",
      changed_by: "HR Manager",
    });
    const rows = history.findByEmployee(employeeId);
    expect(rows).toHaveLength(1);
    expect(rows[0].change_reason).toBe("INITIAL_HIRE");
    expect(rows[0].previous_salary).toBeNull();
  });

  it("returns records newest-first", () => {
    history.insert({
      employee_id: employeeId, previous_salary: null, new_salary: 95000,
      currency: "USD", change_reason: "INITIAL_HIRE", effective_date: "2024-01-15",
      changed_by: "HR Manager",
    });
    history.insert({
      employee_id: employeeId, previous_salary: 95000, new_salary: 105000,
      currency: "USD", change_reason: "MERIT_INCREASE", effective_date: "2024-06-01",
      changed_by: "Jane HR",
    });
    const rows = history.findByEmployee(employeeId);
    expect(rows[0].change_reason).toBe("MERIT_INCREASE");
    expect(rows[1].change_reason).toBe("INITIAL_HIRE");
  });

  it("returns an empty array for an employee with no history", () => {
    expect(history.findByEmployee("does-not-exist")).toEqual([]);
  });

  it("cascades delete when the employee row is removed", () => {
    history.insert({
      employee_id: employeeId, previous_salary: null, new_salary: 95000,
      currency: "USD", change_reason: "INITIAL_HIRE", effective_date: "2024-01-15",
      changed_by: "HR Manager",
    });
    db.prepare("DELETE FROM employees WHERE id = ?").run(employeeId);
    expect(history.findByEmployee(employeeId)).toEqual([]);
  });
});