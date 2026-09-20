import "dotenv/config";
import { createApp } from "./app";
import { getDb } from "./db/connection";
import { runMigrations } from "./db/migrate";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

const db = getDb();
runMigrations(db);

const app = createApp(db);
app.listen(PORT, () => {
  console.log(`ACME Salary Management API listening on http://localhost:${PORT}`);
});