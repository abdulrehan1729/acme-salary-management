# ACME Salary Management — Backend

Node.js + TypeScript + Express API on SQLite (`better-sqlite3`).

## Setup

```bash
npm install
```

Copy the env example and adjust if needed (defaults work out of the box):

```bash
cp .env.example .env
```

## Run

```bash
npm run migrate    # creates data.db and applies schema.sql (idempotent — safe to re-run)
npm run seed        # wipes and re-seeds 10,000 employees (~2s)
npm run dev         # starts the API on http://localhost:4000
```

Health check:

```bash
curl http://localhost:4000/api/health
# {"status":"ok"}
```

## Test

```bash
npm test            # run once
npm run test:watch  # watch mode
```

## Project structure

```
src/
  db/            connection singleton, migration runner, schema.sql, seed script + helpers
  repositories/  raw-SQL data access (EmployeeRepository, SalaryHistoryRepository)
  services/      business rules (EmployeeService, AnalyticsService) + pure stats module
  controllers/   HTTP request/response shaping, no business logic
  routes/        path -> controller method wiring only
  middleware/    centralized error handling
  utils/         lookup/reference data, zod validation schemas
  __tests__/     all test files (flat — see docs/architecture.md for why)
```

Layering: **route → controller → service → repository**. Each layer only talks to the
one below it; business rules live in services, SQL lives only in repositories.

## API overview

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/employees` | List, with `q`, `department`, `country`, `level`, `status`, `page`, `pageSize`, `sortBy`, `sortDir` |
| GET | `/api/employees/:id` | Single employee |
| GET | `/api/employees/:id/salary-history` | Full audit trail for one employee |
| POST | `/api/employees` | Create (writes an `INITIAL_HIRE` history record) |
| PATCH | `/api/employees/:id` | Update (writes a history record only if salary changed) |
| DELETE | `/api/employees/:id` | Soft delete (sets `status: INACTIVE`) |
| GET | `/api/analytics/summary` | Headcount, total/avg/median payroll (active employees only) |
| GET | `/api/analytics/by-department` \| `by-country` \| `by-level` | Grouped breakdowns |
| GET | `/api/meta` | Lookup data for dropdowns — departments, levels, countries, employment types, statuses, salary-change reasons |

See `docs/architecture.md` for the reasoning behind key decisions (single-currency model,
soft delete, the audit-trail rule, index choices).