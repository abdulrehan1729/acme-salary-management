import type { Request, Response } from "express";
import type { AnalyticsService } from "../services/analyticsService";

export class AnalyticsController {
  constructor(private service: AnalyticsService) {}

  summary = (_req: Request, res: Response) => res.json(this.service.summary());
  byDepartment = (_req: Request, res: Response) => res.json(this.service.byDepartment());
  byCountry = (_req: Request, res: Response) => res.json(this.service.byCountry());
  byLevel = (_req: Request, res: Response) => res.json(this.service.byLevel());
}