# AI Usage Notes

This project was built with Claude (Anthropic) as a pairing partner, working step by step
through the codebase in a single ongoing conversation rather than generating the app in one
shot. This doc is an honest account of how that process actually went, including the
corrections along the way — the brief specifically asks how AI was used, not just that it was.

## Workflow
Each backend feature followed RED → GREEN: Claude proposed failing tests first, I reviewed
and ran them to confirm they failed for the right reason, then Claude proposed the
implementation to make them pass. Each RED and each GREEN landed as its own git commit, so
the commit history is a reasonably literal transcript of that process.

Frontend pages were built after the fact, then tested with a mocked API — true TDD doesn't
fit component work well (there's no meaningful "failing test" for a component that doesn't
exist yet in the same way there is for a pure function), so those were built, then tested,
then refined based on what testing surfaced.

## Where I redirected or corrected the AI's proposals
- **Currency modeling**: Claude's first pass assumed multi-currency support (per-country
  currency + FX conversion) because the brief mentions "multiple countries." I pushed back —
  the brief says countries, not currencies — and we settled on a single-currency (USD) model
  for v1, with the schema still carrying currency-related columns as an unused extension
  point rather than removing them outright. Documented as an explicit assumption in
  `requirements.md` rather than left implicit.
- **Index selection**: the initial schema had six secondary indexes, added by default/habit.
  I asked whether they were actually needed; going through each against a real query pattern
  cut it to four, dropping `status` (poor selectivity — ~97% of rows are `ACTIVE`),
  `manager_id` (nothing queries it), and `salary_history.effective_date` (too small a set to
  matter). Documented in `docs/architecture.md`.
- **Query approach and layering**: I asked for TDD, then for a proper
  controller/service/repository split instead of routes containing logic directly, and for
  the repository layer to be hardened (prepared-statement reuse instead of recompiling SQL
  per call, and escaping SQL `LIKE` wildcards in search input) rather than left as
  first-draft raw queries.
- **Folder structure**: went through a few iterations (tests inside `src/db/`, then a
  mirrored `__tests__/db/` subfolder, then settled on a flat `src/__tests__/`) based on
  direct feedback that the nesting wasn't adding value at the size of this test suite.
- **Prisma → better-sqlite3**: Claude's original plan used Prisma; its engine-binary download
  was blocked by a sandboxed environment used partway through planning, so the project moved
  to `better-sqlite3` with hand-written SQL instead. Documented in `docs/architecture.md` as
  a real, environment-forced trade-off rather than a deliberate first choice.

## Tooling issues surfaced and fixed during the build
A handful of real toolchain problems came up and were fixed as part of the normal
development flow (not edited out of the history — they're in the actual commits):
- A Node.js version too old for `create-vite`'s current template (upgraded to Node 22, pinned
  via `.nvmrc`).
- `better-sqlite3`'s native binary going stale after a Node version switch
  (`NODE_MODULE_VERSION` mismatch) — fixed with a clean reinstall, documented in
  `backend/README.md` for future reference.
- A version mismatch between `vite`, `vitest`, and `@vitejs/plugin-react` from mixing
  `create-vite@latest`'s bleeding-edge scaffold with an older, stable `vitest` — resolved by
  pinning all three to compatible versions.
- Missing jest-dom matcher registration and a missing `ResizeObserver` mock (jsdom doesn't
  implement it; recharts' `ResponsiveContainer` needs it) — both fixed via vitest's
  `setupFiles`.

## What AI did not decide unilaterally
Scope decisions in `requirements.md` — what's in v1, what's deliberately deferred and why —
were made deliberately, with Claude proposing options and trade-offs rather than picking
silently. The single-currency assumption above is the clearest example: it was flagged as an
assumption to confirm, not built and left undocumented.