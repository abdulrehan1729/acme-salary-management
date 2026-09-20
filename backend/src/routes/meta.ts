import { Router } from "express";
import { MetaController } from "../controllers/metaController";
import { asyncHandler } from "../middleware/errorHandler";

export function metaRouter(): Router {
  const router = Router();
  const controller = new MetaController();

  router.get("/", asyncHandler(controller.getAll));

  return router;
}