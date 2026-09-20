import type { Request, Response } from "express";
import {
  DEPARTMENTS,
  LEVELS,
  COUNTRIES,
  EMPLOYMENT_TYPES,
  EMPLOYEE_STATUSES,
  SALARY_CHANGE_REASONS,
} from "../utils/lookups";

export class MetaController {
  getAll = (_req: Request, res: Response) => {
    res.json({
      departments: DEPARTMENTS,
      levels: LEVELS,
      countries: COUNTRIES,
      employmentTypes: EMPLOYMENT_TYPES,
      statuses: EMPLOYEE_STATUSES,
      changeReasons: SALARY_CHANGE_REASONS,
    });
  };
}