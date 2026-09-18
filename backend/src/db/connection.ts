import Database from "better-sqlite3";
import path from "node:path";

const DB_PATH = process.env.DATABASE_PATH ?? path.join(__dirname, "..", "..", "data.db");

let db: Database.Database | undefined;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}

/** Test-only escape hatch: point the module at a fresh in-memory database. */
export function resetDbForTests(): Database.Database {
  db?.close();
  db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  return db;
}