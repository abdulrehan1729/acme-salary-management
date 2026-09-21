import express, { type Express } from "express";
import cors from "cors";
import type Database from "better-sqlite3";
import { employeesRouter } from "./routes/employees";
import { analyticsRouter } from "./routes/analytics";
import { metaRouter } from "./routes/meta";
import { errorHandler } from "./middleware/errorHandler";

export function createApp(db: Database.Database): Express {
  const app = express();
  const allowedOrigin = process.env.FRONTEND_URL; // e.g. https://acme-salary.vercel.app
  app.use(cors({ origin: allowedOrigin ?? true })); // true = allow all, for local dev when unset

  app.use(express.json());


  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/employees", employeesRouter(db));
  app.use("/api/analytics", analyticsRouter(db));
  app.use("/api/meta", metaRouter());

  app.use(errorHandler);
  return app;
}