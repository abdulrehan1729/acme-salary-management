import { Router } from "express";
import type Database from "better-sqlite3";
import { AnalyticsService } from "../services/analyticsService";
import { AnalyticsController } from "../controllers/analyticsController";
import { asyncHandler } from "../middleware/errorHandler";

export function analyticsRouter(db: Database.Database): Router {
  const router = Router();
  const controller = new AnalyticsController(new AnalyticsService(db));

  router.get("/summary", asyncHandler(controller.summary));
  router.get("/by-department", asyncHandler(controller.byDepartment));
  router.get("/by-country", asyncHandler(controller.byCountry));
  router.get("/by-level", asyncHandler(controller.byLevel));

  return router;
}