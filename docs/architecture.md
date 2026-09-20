# Architecture & Design Notes — Backend

## Stack
Node.js + TypeScript + Express, SQLite via `better-sqlite3` (synchronous, in-process,
zero external DB server — appropriate at 10k-row scale and for a self-contained take-home).

## Layering: route → controller → service → repository
Not literal MVC (there's no View layer — this is a JSON API; the frontend is a fully
separate app over HTTP). It's a standard layered/repository architecture:
- **Repository** (`src/repositories/`) — the only place raw SQL lives. Prepared statements
  are compiled once in the constructor and reused, rather than recompiled per call.
- **Service** (`src/services/`) — business rules: duplicate-email rejection, not-found
  handling, and the audit-trail rule (below). No SQL, no HTTP.
- **Controller** (`src/controllers/`) — request parsing (zod) and response shaping only.
  No business logic.
- **Routes** (`src/routes/`) — pure path → controller-method wiring.

Each layer is independently testable: repository tests hit a real in-memory SQLite DB;
service tests use the repository directly; controller tests mock the service; a final
integration suite (`employees.api.test.ts`) exercises the real Express app end-to-end.

## The core business rule: salary changes are never silent overwrites
`EmployeeService.create` writes one `INITIAL_HIRE` row to `salary_history`.
`EmployeeService.update` writes a new history row **only when `baseSalaryAnnual` actually
changed**, capturing the previous amount, new amount, reason (defaults to `CORRECTION` if
not supplied), effective date, and who made the change. The employee's current salary is
denormalized onto the `employees` table for fast list/sort at 10k rows; `salary_history`
is the append-only source of truth for "what happened and when." This is enforced in one
place (the service), so it holds regardless of which client calls the API.

## Single-currency assumption (documented, not silent)
The brief says employees span "multiple countries," not "multiple currencies." Rather than
assume real per-country pay (which would need live/versioned FX rates — a distinct, harder
problem), v1 pays every employee in a single currency (USD). The schema still carries
`currency` and a `base_salary_annual_usd` column so real per-country currency handling
could be added later without a migration — right now `base_salary_annual_usd` is an
identity copy of `base_salary_annual`, not a conversion. See `requirements.md` for the
explicit assumption statement.

## Why a soft delete (offboarding), not a hard delete
`DELETE /api/employees/:id` sets `status = 'INACTIVE'`. Salary history has a foreign key
to the employee and must survive offboarding — HR still needs to answer "what did we pay
this person while they were here." Analytics filters to `status = 'ACTIVE'` so former
employees don't skew current pay stats.

## Indexes — chosen against actual query patterns, not by habit
Started with six secondary indexes, trimmed to four after checking each against a real
query the app makes:
- **Kept**: `department`, `country`, `level` (back real filters), `(last_name, first_name)`
  composite (backs the default sort/pagination), `salary_history.employee_id` (the hot
  lookup + FK cascade path).
- **Cut**: `status` (≈97% of rows are `ACTIVE` — too low-selectivity for the planner to
  prefer over a scan), `manager_id` (nothing queries "find this manager's reports" —
  org-chart features are out of scope), `salary_history.effective_date` (only sorts one
  employee's small history set, not worth it at this scale).

At 10,000 rows SQLite can full-scan the table in well under a millisecond regardless —
none of this was required to hit the stated performance target; it's picked to match
actual query shape, not maximized speculatively.

## Search hardening
`findMany`'s `q` filter uses parameterized `LIKE` queries (never string concatenation, so
already immune to SQL injection) — but the raw search term wasn't escaped against SQL's
own `%`/`_` wildcards, so a search for a literal `"50%"` would have matched unintended
rows. Fixed by escaping `%`, `_`, and `\` in the search term and using `LIKE ... ESCAPE '\'`.

## Seed data
`npm run seed` generates 10,000 employees in a single SQLite transaction (~2s), with:
- Weighted department/level/country distribution (a pyramid-shaped org, not a flat random one)
- A manager hierarchy: an employee at level L(n) optionally reports to someone at L(n+1)
  in the same department+country
- Salary drawn from a level-specific USD band (`seedHelpers.ts`, unit-tested directly)
- One `INITIAL_HIRE` salary-history record per employee

Faker is seeded for reproducibility; department/level/country *distribution* is stable in
aggregate across runs, though individual assignments use plain `Math.random` for the
weighted pick, so exact per-row results vary slightly run to run.

## What I'd do differently with more time
- Move analytics aggregation (`AnalyticsService`) into SQL `GROUP BY` queries instead of
  pulling all active employees into Node and aggregating in memory — fine at 10k rows,
  the first thing to change if the org grew to hundreds of thousands of employees.
- Add optimistic-concurrency handling on employee updates (compare `updatedAt`) — currently
  last-write-wins, acceptable given the single-HR-Manager scope in `requirements.md`.
- Real per-country currency conversion, if the single-currency assumption turns out wrong.

## Meta endpoint — one source of truth for lookup data
`GET /api/meta` returns the same `DEPARTMENTS`/`LEVELS`/`COUNTRIES`/etc. constants the
backend validates create/update requests against (`src/utils/lookups.ts`). The frontend's
dropdowns are populated from this endpoint rather than a hardcoded duplicate list, so the
two can't drift out of sync — a value the UI offers is guaranteed to be one the API accepts.