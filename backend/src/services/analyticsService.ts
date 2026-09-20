import type Database from "better-sqlite3";
import { EmployeeRepository, type EmployeeRow } from "../repositories/employeeRepository";
import { groupSalaryStats, mean, median, sum } from "./stats";

export class AnalyticsService {
  private employees: EmployeeRepository;

  constructor(db: Database.Database) {
    this.employees = new EmployeeRepository(db);
  }

  summary() {
    const active = this.employees.findAllActive();
    const salaries = active.map((e) => e.base_salary_annual_usd);
    return {
      activeHeadcount: active.length,
      totalAnnualPayrollUsd: sum(salaries),
      averageSalaryUsd: mean(salaries),
      medianSalaryUsd: median(salaries),
    };
  }

  byDepartment() {
    return this.grouped((e) => e.department);
  }

  byCountry() {
    return this.grouped((e) => `${e.country_name} (${e.country})`);
  }

  byLevel() {
    return this.grouped((e) => e.level);
  }

  private grouped(keyOf: (e: EmployeeRow) => string) {
    const active = this.employees.findAllActive();
    return groupSalaryStats(active, keyOf, (e) => e.base_salary_annual_usd);
  }
}