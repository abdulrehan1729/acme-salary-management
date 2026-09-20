import type { Request, Response } from "express";
import type { EmployeeService } from "../services/employeeService";
import { createEmployeeSchema, updateEmployeeSchema, employeeQuerySchema } from "../utils/validation";

export class EmployeeController {
  constructor(private service: EmployeeService) {}

  list = (req: Request, res: Response) => {
    const query = employeeQuerySchema.parse(req.query);
    res.json(this.service.list(query));
  };

  getById = (req: Request, res: Response) => {
    const id = String(req.params.id);
    res.json(this.service.getById(id));
  };

  create = (req: Request, res: Response) => {
    const input = createEmployeeSchema.parse(req.body);
    res.status(201).json(this.service.create(input));
  };

  update = (req: Request, res: Response) => {
    const input = updateEmployeeSchema.parse(req.body);
    const id = String(req.params.id);
    res.json(this.service.update(id, input));
  };

  deactivate = (req: Request, res: Response) => {
    const id = String(req.params.id);
    res.json(this.service.deactivate(id));
  };
}