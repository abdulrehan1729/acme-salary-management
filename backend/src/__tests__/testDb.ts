import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export function createTestDb(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  const schema = fs.readFileSync(path.join(__dirname, "..", "db", "schema.sql"), "utf-8");
  db.exec(schema);
  return db;
}