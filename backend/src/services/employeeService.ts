import type Database from "better-sqlite3";
import { EmployeeRepository, type EmployeeFilters, type EmployeeRow } from "../repositories/employeeRepository";
import { SalaryHistoryRepository } from "../repositories/salaryHistoryRepository";
import { findCountry, DEFAULT_CURRENCY } from "../utils/lookups";
import type { CreateEmployeeInput, UpdateEmployeeInput } from "../utils/validation";

export class NotFoundError extends Error {}
export class ConflictError extends Error {}

export class EmployeeService {
  private employees: EmployeeRepository;
  private salaryHistory: SalaryHistoryRepository;

  constructor(db: Database.Database) {
    this.employees = new EmployeeRepository(db);
    this.salaryHistory = new SalaryHistoryRepository(db);
  }

  list(filters: EmployeeFilters) {
    const { rows, total } = this.employees.findMany(filters);
    return {
      data: rows.map(toDTO),
      pagination: {
        page: filters.page ?? 1,
        pageSize: filters.pageSize ?? 25,
        total,
        totalPages: Math.max(1, Math.ceil(total / (filters.pageSize ?? 25))),
      },
    };
  }

  getById(id: string) {
    const row = this.employees.findById(id);
    if (!row) throw new NotFoundError(`Employee ${id} not found`);
    return toDTO(row);
  }

  getSalaryHistory(id: string) {
    const employee = this.employees.findById(id);
    if (!employee) throw new NotFoundError(`Employee ${id} not found`);
    return this.salaryHistory.findByEmployee(id).map((h) => ({
      id: h.id,
      previousSalary: h.previous_salary,
      newSalary: h.new_salary,
      currency: h.currency,
      changeReason: h.change_reason,
      effectiveDate: h.effective_date,
      changedBy: h.changed_by,
      createdAt: h.created_at,
    }));
  }

  create(input: CreateEmployeeInput) {
    if (this.employees.findByEmail(input.email)) {
      throw new ConflictError(`Email ${input.email} is already in use`);
    }
    const country = findCountry(input.country);

    const row = this.employees.insert({
      employee_code: this.employees.nextEmployeeCode(),
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      department: input.department,
      job_title: input.jobTitle,
      level: input.level,
      country: country.code,
      country_name: country.name,
      currency: DEFAULT_CURRENCY,
      employment_type: input.employmentType,
      status: input.status,
      manager_id: input.managerId ?? null,
      hire_date: input.hireDate,
      base_salary_annual: input.baseSalaryAnnual,
      base_salary_annual_usd: input.baseSalaryAnnual,
    });

    this.salaryHistory.insert({
      employee_id: row.id,
      previous_salary: null,
      new_salary: input.baseSalaryAnnual,
      currency: DEFAULT_CURRENCY,
      change_reason: "INITIAL_HIRE",
      effective_date: input.hireDate,
      changed_by: input.changedBy,
    });

    return toDTO(row);
  }

  update(id: string, input: UpdateEmployeeInput) {
    const existing = this.employees.findById(id);
    if (!existing) throw new NotFoundError(`Employee ${id} not found`);

    if (input.email && input.email !== existing.email && this.employees.findByEmail(input.email)) {
      throw new ConflictError(`Email ${input.email} is already in use`);
    }

    const country = findCountry(input.country ?? existing.country);
    const salaryChanged =
      input.baseSalaryAnnual !== undefined && input.baseSalaryAnnual !== existing.base_salary_annual;
    const newSalary = input.baseSalaryAnnual ?? existing.base_salary_annual;

    const updated = this.employees.update(id, {
      first_name: input.firstName ?? existing.first_name,
      last_name: input.lastName ?? existing.last_name,
      email: input.email ?? existing.email,
      department: input.department ?? existing.department,
      job_title: input.jobTitle ?? existing.job_title,
      level: input.level ?? existing.level,
      country: country.code,
      country_name: country.name,
      currency: DEFAULT_CURRENCY,
      employment_type: input.employmentType ?? existing.employment_type,
      status: input.status ?? existing.status,
      manager_id: input.managerId === undefined ? existing.manager_id : input.managerId,
      hire_date: input.hireDate ?? existing.hire_date,
      base_salary_annual: newSalary,
      base_salary_annual_usd: newSalary,
    })!;

    if (salaryChanged) {
      this.salaryHistory.insert({
        employee_id: id,
        previous_salary: existing.base_salary_annual,
        new_salary: newSalary,
        currency: DEFAULT_CURRENCY,
        change_reason: input.changeReason ?? "CORRECTION",
        effective_date: input.effectiveDate ?? new Date().toISOString().slice(0, 10),
        changed_by: input.changedBy ?? "HR Manager",
      });
    }

    return toDTO(updated);
  }

  deactivate(id: string) {
    const existing = this.employees.findById(id);
    if (!existing) throw new NotFoundError(`Employee ${id} not found`);
    return toDTO(this.employees.update(id, { status: "INACTIVE" })!);
  }
}

function toDTO(row: EmployeeRow) {
  return {
    id: row.id,
    employeeCode: row.employee_code,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    department: row.department,
    jobTitle: row.job_title,
    level: row.level,
    country: row.country,
    countryName: row.country_name,
    currency: row.currency,
    employmentType: row.employment_type,
    status: row.status,
    managerId: row.manager_id,
    hireDate: row.hire_date,
    baseSalaryAnnual: row.base_salary_annual,
    baseSalaryAnnualUsd: row.base_salary_annual_usd,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}