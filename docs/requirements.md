# ACME Salary Management — Requirements

## Goal
Replace ACME's spreadsheet-based salary process with a single web application that lets an
**HR Manager** view, maintain, and reason about compensation for ~10,000 employees across
multiple countries — safely, quickly, and without manual Excel formulas.

Two jobs the product must do well:
1. **System of record** — create/update employee compensation data with an auditable trail.
2. **System of answers** — let the HR Manager answer questions like "what's our average
   engineering salary in Germany?" or "who got a raise last quarter?" without exporting to Excel.

## Primary User & Core Jobs-to-be-Done
HR Manager, non-technical, comfortable with spreadsheets, needs to:
- Look up / search any employee's current pay, quickly, at 10k-row scale.
- Update an employee's salary and know *why* and *when* it changed, later.
- Slice pay by department, country, level to spot outliers and answer leadership questions.
- Onboard/offboard employees without touching a database.

## In Scope (v1)
- **Employee directory**: search, filter (department, country, level, status), paginate, sort.
- **Employee profile**: personal + employment details, current salary, full salary change history.
- **Salary editing**: every salary change is captured as an immutable history record
  (previous amount, new amount, reason, effective date) — never a silent overwrite.
- **Compensation analytics dashboard**: headcount & total payroll (normalized to USD),
  average/median salary by department, by country, and by level — the direct answer to
  "how do we pay people."
- **CSV export** of the current employee/salary table, for the one-off ad hoc analysis HR
  still wants to do in Excel.
- **Seed data**: realistic 10,000-employee dataset across ~8 countries, 9 departments, 6 levels.

## Deliberately Out of Scope (v1) — and why
- **Multi-user auth / roles (RBAC), SSO** — the brief specifies a single persona (HR Manager).
  Building real auth would spend effort on infrastructure the assessment isn't evaluating.
  A `changedBy` field on salary history stands in for "who did this."
- **Payroll processing / tax / statutory compliance / bank disbursement** — this is a
  *management* tool, not a payroll *run* engine; running actual payroll is a distinct,
  jurisdiction-heavy problem (tax tables, statutory filings) out of scope for this exercise.
- **Approval workflows** (e.g., manager sign-off before a raise takes effect) — valuable in a
  real org, but adds a second actor/role the persona list doesn't include. Noted as a natural
  v2: salary changes already land in an auditable history table, which is the prerequisite.
- **LLM/NL "ask a question" interface** — tempting given the "AI-driven" framing, but it
  introduces non-determinism and an external API dependency into the core deliverable. The
  filterable analytics dashboard answers the stated questions deterministically instead;
  an LLM layer *on top of* the analytics API is a reasonable, clearly-separable v2.
  Sensitive attributes (e.g. gender/ethnicity pay-gap analysis) are intentionally not modeled
  or reported on — that requires legal/compliance review before building, not an engineering call.
- **Real-time collaboration / multi-tab conflict resolution** — one HR Manager at a time is a
  reasonable v1 assumption at this org size; optimistic concurrency (updatedAt check) is
  enough of a guardrail for now.
- **Internationalization (i18n) of the UI** — the HR Manager persona is a single user; currency
  *values* are still handled correctly (each employee keeps native currency + a normalized USD
  figure for cross-country comparison), only UI copy stays English-only.
- **Bulk CSV import / org-chart editing UI** — export is in scope (HR needs data out); import
  and manager-hierarchy editing are natural extensions once the core model is validated, but
  doubled the surface area of this exercise without changing the core engineering story.

## Non-functional targets
- Directory search/filter/pagination stays responsive at 10,000 rows (server-side pagination
  and indexed queries, not client-side filtering of the full set).
- Every salary mutation is atomic and produces exactly one history record.
- Core calculation/aggregation logic is unit-tested independent of the HTTP layer.