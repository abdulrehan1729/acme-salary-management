import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { EmployeeController } from "../controllers/employeeController";
import type { EmployeeService } from "../services/employeeService";

function mockRes() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe("EmployeeController", () => {
  let service: Partial<EmployeeService>;
  let controller: EmployeeController;

  beforeEach(() => {
    service = {
      list: vi.fn().mockReturnValue({ data: [], pagination: { page: 1, pageSize: 25, total: 0, totalPages: 1 } }),
      getById: vi.fn().mockReturnValue({ id: "1" }),
      create: vi.fn().mockReturnValue({ id: "1" }),
      update: vi.fn().mockReturnValue({ id: "1" }),
      deactivate: vi.fn().mockReturnValue({ id: "1", status: "INACTIVE" }),
    };
    controller = new EmployeeController(service as EmployeeService);
  });

  it("list parses query params and delegates to service.list", () => {
    const req = { query: { department: "Engineering" } } as unknown as Request;
    const res = mockRes();
    controller.list(req, res);
    expect(service.list).toHaveBeenCalledWith(expect.objectContaining({ department: "Engineering" }));
    expect(res.json).toHaveBeenCalled();
  });

  it("getById delegates to service.getById with the route param", () => {
    const req = { params: { id: "emp-1" } } as unknown as Request;
    const res = mockRes();
    controller.getById(req, res);
    expect(service.getById).toHaveBeenCalledWith("emp-1");
  });

  it("create validates and parses the body before calling service.create, returning 201", () => {
    const req = {
      body: {
        firstName: "Ada", lastName: "Lovelace", email: "ada@acme.com",
        department: "Engineering", jobTitle: "SWE", level: "L4", country: "GB",
        hireDate: "2024-01-15", baseSalaryAnnual: 95000,
      },
    } as Request;
    const res = mockRes();
    controller.create(req, res);
    expect(service.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("create throws without calling the service when the body fails validation", () => {
    const req = { body: { firstName: "" } } as Request;
    const res = mockRes();
    expect(() => controller.create(req, res)).toThrow();
    expect(service.create).not.toHaveBeenCalled();
  });

  it("update delegates to service.update with id and parsed body", () => {
    const req = { params: { id: "emp-1" }, body: { jobTitle: "Staff Engineer" } } as unknown as Request;
    const res = mockRes();
    controller.update(req, res);
    expect(service.update).toHaveBeenCalledWith("emp-1", expect.objectContaining({ jobTitle: "Staff Engineer" }));
  });

  it("deactivate delegates to service.deactivate with the route param", () => {
    const req = { params: { id: "emp-1" } } as unknown as Request;
    const res = mockRes();
    controller.deactivate(req, res);
    expect(service.deactivate).toHaveBeenCalledWith("emp-1");
  });
});