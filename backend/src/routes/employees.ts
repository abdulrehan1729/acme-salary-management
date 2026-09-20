import { Router } from "express";
import type Database from "better-sqlite3";
import { EmployeeService } from "../services/employeeService";
import { EmployeeController } from "../controllers/employeeController";
import { asyncHandler } from "../middleware/errorHandler";

export function employeesRouter(db: Database.Database): Router {
  const router = Router();
  const controller = new EmployeeController(new EmployeeService(db));

  router.get("/", asyncHandler(controller.list));
  router.get("/:id", asyncHandler(controller.getById));
  router.post("/", asyncHandler(controller.create));
  router.patch("/:id", asyncHandler(controller.update));
  router.delete("/:id", asyncHandler(controller.deactivate));

  return router;
}