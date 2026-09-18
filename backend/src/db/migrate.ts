import fs from "node:fs";
import path from "node:path";
import { getDb } from "./connection";

export function runMigrations(db = getDb()): void {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  db.exec(schema);
}

if (require.main === module) {
  runMigrations();
  console.log("Migrations applied.");
}