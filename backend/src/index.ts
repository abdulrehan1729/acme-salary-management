import "dotenv/config";
import { createApp } from "./app";
import { getDb } from "./db/connection";
import { runMigrations } from "./db/migrate";
import { seedIfEmpty } from "./db/seed";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

async function main() {
  const db = getDb();
  runMigrations(db);
  await seedIfEmpty(db);

  const app = createApp(db);
  app.listen(PORT, () => {
    console.log(`ACME Salary Management API listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});