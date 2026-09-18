-- ACME Salary Management schema.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS employees (
  id                     TEXT PRIMARY KEY,
  employee_code          TEXT NOT NULL UNIQUE,

  first_name             TEXT NOT NULL,
  last_name              TEXT NOT NULL,
  email                  TEXT NOT NULL UNIQUE,

  department             TEXT NOT NULL,
  job_title               TEXT NOT NULL,
  level                  TEXT NOT NULL,

  country                TEXT NOT NULL,       -- ISO 3166-1 alpha-2
  country_name           TEXT NOT NULL,
  currency               TEXT NOT NULL,       -- ISO 4217

  employment_type        TEXT NOT NULL DEFAULT 'FULL_TIME',
  status                 TEXT NOT NULL DEFAULT 'ACTIVE',

  manager_id             TEXT REFERENCES employees(id) ON DELETE SET NULL,

  hire_date              TEXT NOT NULL,       -- ISO date

  base_salary_annual     REAL NOT NULL,
  base_salary_annual_usd REAL NOT NULL,

  created_at             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_country    ON employees(country);
CREATE INDEX IF NOT EXISTS idx_employees_status     ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_name       ON employees(last_name, first_name);

CREATE TABLE IF NOT EXISTS salary_history (
  id               TEXT PRIMARY KEY,
  employee_id      TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  previous_salary  REAL,                       -- null for the initial-hire record
  new_salary       REAL NOT NULL,
  currency         TEXT NOT NULL,
  change_reason    TEXT NOT NULL,               -- INITIAL_HIRE | MERIT_INCREASE | PROMOTION | MARKET_ADJUSTMENT | CORRECTION
  effective_date   TEXT NOT NULL,
  changed_by       TEXT NOT NULL,

  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_salary_history_employee ON salary_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_history_date     ON salary_history(effective_date);