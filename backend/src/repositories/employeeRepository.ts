import type Database from "better-sqlite3";
import type { Statement } from "better-sqlite3";
import { randomUUID } from "node:crypto";

export interface EmployeeRow {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  job_title: string;
  level: string;
  country: string;
  country_name: string;
  currency: string;
  employment_type: string;
  status: string;
  manager_id: string | null;
  hire_date: string;
  base_salary_annual: number;
  base_salary_annual_usd: number;
  created_at: string;
  updated_at: string;
}

export interface EmployeeFilters {
  q?: string;
  department?: string;
  country?: string;
  level?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "lastName" | "hireDate" | "salary" | "employeeCode";
  sortDir?: "asc" | "desc";
}

const SORT_COLUMN: Record<NonNullable<EmployeeFilters["sortBy"]>, string> = {
  lastName: "last_name",
  hireDate: "hire_date",
  salary: "base_salary_annual_usd",
  employeeCode: "employee_code",
};

/** Escapes SQL LIKE metacharacters (% and _) so a search term matches literally. */
function escapeLikeValue(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

export class EmployeeRepository {
  // Fixed-shape statements: SQL text never changes, so prepare once instead of
  // recompiling on every call.
  private insertStmt: Statement;
  private findByIdStmt: Statement;
  private findByEmailStmt: Statement;
  private nextCodeStmt: Statement;
  private updateStmt: Statement;

  // findMany's WHERE/ORDER BY text varies with active filters/sort — only a handful
  // of distinct shapes occur in practice, so memoize each the first time it's seen.
  private findManyStmtCache = new Map<string, Statement>();
  private countStmtCache = new Map<string, Statement>();

  constructor(private db: Database.Database) {
    this.insertStmt = db.prepare(`INSERT INTO employees (
      id, employee_code, first_name, last_name, email, department, job_title, level,
      country, country_name, currency, employment_type, status, manager_id, hire_date,
      base_salary_annual, base_salary_annual_usd
    ) VALUES (
      @id, @employee_code, @first_name, @last_name, @email, @department, @job_title, @level,
      @country, @country_name, @currency, @employment_type, @status, @manager_id, @hire_date,
      @base_salary_annual, @base_salary_annual_usd
    )`);
    this.findByIdStmt = db.prepare("SELECT * FROM employees WHERE id = ?");
    this.findByEmailStmt = db.prepare("SELECT * FROM employees WHERE email = ?");
    this.nextCodeStmt = db.prepare(
      "SELECT employee_code FROM employees ORDER BY employee_code DESC LIMIT 1",
    );
    this.updateStmt = db.prepare(`UPDATE employees SET
      first_name = @first_name, last_name = @last_name, email = @email,
      department = @department, job_title = @job_title, level = @level,
      country = @country, country_name = @country_name, currency = @currency,
      employment_type = @employment_type, status = @status, manager_id = @manager_id,
      hire_date = @hire_date, base_salary_annual = @base_salary_annual,
      base_salary_annual_usd = @base_salary_annual_usd,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
    WHERE id = @id`);
  }

  private getCountStmt(whereClause: string): Statement {
    let stmt = this.countStmtCache.get(whereClause);
    if (!stmt) {
      stmt = this.db.prepare(`SELECT COUNT(*) AS count FROM employees ${whereClause}`);
      this.countStmtCache.set(whereClause, stmt);
    }
    return stmt;
  }

  private getFindManyStmt(whereClause: string, sortColumn: string, sortDir: string): Statement {
    const key = `${whereClause}|${sortColumn}|${sortDir}`;
    let stmt = this.findManyStmtCache.get(key);
    if (!stmt) {
      stmt = this.db.prepare(
        `SELECT * FROM employees ${whereClause} ORDER BY ${sortColumn} ${sortDir} LIMIT @limit OFFSET @offset`,
      );
      this.findManyStmtCache.set(key, stmt);
    }
    return stmt;
  }

  findMany(filters: EmployeeFilters): { rows: EmployeeRow[]; total: number } {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(200, Math.max(1, filters.pageSize ?? 25));
    const offset = (page - 1) * pageSize;

    const where: string[] = [];
    const params: Record<string, unknown> = {};

    if (filters.q) {
      where.push(
        "(first_name LIKE @q ESCAPE '\\' OR last_name LIKE @q ESCAPE '\\' OR email LIKE @q ESCAPE '\\' OR employee_code LIKE @q ESCAPE '\\')",
      );
      params.q = `%${escapeLikeValue(filters.q)}%`;
    }
    if (filters.department) { where.push("department = @department"); params.department = filters.department; }
    if (filters.country) { where.push("country = @country"); params.country = filters.country; }
    if (filters.level) { where.push("level = @level"); params.level = filters.level; }
    if (filters.status) { where.push("status = @status"); params.status = filters.status; }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const sortColumn = SORT_COLUMN[filters.sortBy ?? "lastName"];
    const sortDir = filters.sortDir === "desc" ? "DESC" : "ASC";

    const total = this.getCountStmt(whereClause).get(params) as { count: number };
    const rows = this.getFindManyStmt(whereClause, sortColumn, sortDir).all({
      ...params,
      limit: pageSize,
      offset,
    }) as EmployeeRow[];

    return { rows, total: total.count };
  }

  findById(id: string): EmployeeRow | undefined {
    return this.findByIdStmt.get(id) as EmployeeRow | undefined;
  }

  findByEmail(email: string): EmployeeRow | undefined {
    return this.findByEmailStmt.get(email) as EmployeeRow | undefined;
  }

  nextEmployeeCode(): string {
    const row = this.nextCodeStmt.get() as { employee_code: string } | undefined;
    const nextNum = row ? parseInt(row.employee_code.replace("EMP-", ""), 10) + 1 : 1;
    return `EMP-${String(nextNum).padStart(6, "0")}`;
  }

  insert(row: Omit<EmployeeRow, "id" | "created_at" | "updated_at">): EmployeeRow {
    const id = randomUUID();
    this.insertStmt.run({ id, ...row });
    return this.findById(id)!;
  }

  update(
    id: string,
    patch: Partial<Omit<EmployeeRow, "id" | "created_at" | "updated_at">>,
  ): EmployeeRow | undefined {
    const existing = this.findById(id);
    if (!existing) return undefined;
    const merged = { ...existing, ...patch };
    this.updateStmt.run(merged);
    return this.findById(id);
  }
}