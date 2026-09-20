import type Database from "better-sqlite3";
import type { Statement } from "better-sqlite3";
import { randomUUID } from "node:crypto";

export interface SalaryHistoryRow {
  id: string;
  employee_id: string;
  previous_salary: number | null;
  new_salary: number;
  currency: string;
  change_reason: string;
  effective_date: string;
  changed_by: string;
  created_at: string;
}

export class SalaryHistoryRepository {
  private insertStmt: Statement;
  private findByEmployeeStmt: Statement;

  constructor(db: Database.Database) {
    this.insertStmt = db.prepare(`INSERT INTO salary_history (
      id, employee_id, previous_salary, new_salary, currency, change_reason,
      effective_date, changed_by
    ) VALUES (
      @id, @employee_id, @previous_salary, @new_salary, @currency, @change_reason,
      @effective_date, @changed_by
    )`);
    this.findByEmployeeStmt = db.prepare(
      "SELECT * FROM salary_history WHERE employee_id = ? ORDER BY effective_date DESC, created_at DESC",
    );
  }

  insert(row: Omit<SalaryHistoryRow, "id" | "created_at">): SalaryHistoryRow {
    const id = randomUUID();
    this.insertStmt.run({ id, ...row });
    return this.findByEmployeeStmt.all(row.employee_id).find((r) => (r as SalaryHistoryRow).id === id) as SalaryHistoryRow;
  }

  findByEmployee(employeeId: string): SalaryHistoryRow[] {
    return this.findByEmployeeStmt.all(employeeId) as SalaryHistoryRow[];
  }
}