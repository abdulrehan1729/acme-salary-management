# ACME Salary Management

Employee salary management for ACME's HR team — replacing spreadsheets with a searchable
directory, an auditable salary-change history, and compensation analytics, for ~10,000
employees. Built for the Incubyte take-home assessment.

See `docs/requirements.md` for the product framing (goal, scope, and what's deliberately
left out) and `docs/architecture.md` for engineering decisions and trade-offs.

## Stack

- **Backend**: Node.js, TypeScript, Express, SQLite (`better-sqlite3`) — see `backend/README.md`
- **Frontend**: React, TypeScript, Vite, MUI, TanStack Query, Recharts — see `frontend/README.md`

## Quick start

Two terminals, from the repo root:

```bash
# Terminal 1 — backend
cd backend
npm install
npm run migrate
npm run seed        # seeds 10,000 employees, ~2s
npm run dev          # http://localhost:4000
```

```bash
# Terminal 2 — frontend
cd frontend
npm install
npm run dev          # http://localhost:5173 (or whatever Vite prints)
```

Open the frontend URL — you should see the seeded employee directory.

## Tests

```bash
cd backend && npm test    # repository, service, controller, integration, and pure-logic tests
cd frontend && npm test   # component and pure-function tests
```

## Repository layout

```
docs/          requirements, architecture, AI-usage notes
backend/       Express API — see backend/README.md for structure and endpoints
frontend/      React app — pages, API client, component tests
```

## Documentation index

- [`docs/requirements.md`](docs/requirements.md) — product framing, scope, what's deliberately out
- [`docs/architecture.md`](docs/architecture.md) — key design decisions and trade-offs
- [`docs/ai-usage.md`](docs/ai-usage.md) — how AI tools were used in building this
- [`backend/README.md`](backend/README.md) — backend setup, API reference, project structure