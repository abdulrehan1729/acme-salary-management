import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createTestDb } from "./testDb";
import { createApp } from "../app";

const validPayload = {
  firstName: "Ada", lastName: "Lovelace", email: "ada@acme.com",
  department: "Engineering", jobTitle: "Senior Software Engineer", level: "L4",
  country: "GB", hireDate: "2024-01-15", baseSalaryAnnual: 95000,
};

describe("Employees API", () => {
  let app: Express;

  beforeEach(() => {
    app = createApp(createTestDb());
  });

  it("POST /api/employees creates an employee and returns 201", async () => {
    const res = await request(app).post("/api/employees").send(validPayload);
    expect(res.status).toBe(201);
    expect(res.body.employeeCode).toMatch(/^EMP-\d{6}$/);
  });

  it("POST /api/employees returns 400 for invalid input", async () => {
    const res = await request(app).post("/api/employees").send({ ...validPayload, department: "Not Real" });
    expect(res.status).toBe(400);
  });

  it("POST /api/employees returns 409 for a duplicate email", async () => {
    await request(app).post("/api/employees").send(validPayload);
    const res = await request(app).post("/api/employees").send(validPayload);
    expect(res.status).toBe(409);
  });

  it("GET /api/employees/:id returns the employee", async () => {
    const created = await request(app).post("/api/employees").send(validPayload);
    const res = await request(app).get(`/api/employees/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("ada@acme.com");
  });

  it("GET /api/employees/:id returns 404 for an unknown id", async () => {
    const res = await request(app).get("/api/employees/does-not-exist");
    expect(res.status).toBe(404);
  });

  it("GET /api/employees supports filtering by department", async () => {
    await request(app).post("/api/employees").send(validPayload);
    await request(app).post("/api/employees").send({ ...validPayload, email: "grace@acme.com", department: "Sales" });
    const res = await request(app).get("/api/employees?department=Sales");
    expect(res.body.pagination.total).toBe(1);
  });

  it("PATCH /api/employees/:id updates a field", async () => {
    const created = await request(app).post("/api/employees").send(validPayload);
    const res = await request(app).patch(`/api/employees/${created.body.id}`).send({ jobTitle: "Staff Engineer" });
    expect(res.status).toBe(200);
    expect(res.body.jobTitle).toBe("Staff Engineer");
  });

  it("DELETE /api/employees/:id soft-deletes (status INACTIVE)", async () => {
    const created = await request(app).post("/api/employees").send(validPayload);
    const res = await request(app).delete(`/api/employees/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("INACTIVE");
  });

  it("treats a literal % in a search query string as a literal character, not a SQL wildcard", async () => {
    await request(app).post("/api/employees").send({ ...validPayload, email: "a@acme.com", lastName: "50%Off" });
    await request(app).post("/api/employees").send({ ...validPayload, email: "b@acme.com", lastName: "Anyone" });
    const res = await request(app).get("/api/employees?q=50%25"); // %25 = URL-encoded literal "%"
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].lastName).toBe("50%Off");
  });
  it("GET /api/employees/:id/salary-history returns the audit trail", async () => {
  const created = await request(app).post("/api/employees").send(validPayload);
  await request(app)
    .patch(`/api/employees/${created.body.id}`)
    .send({ baseSalaryAnnual: 105000, changeReason: "PROMOTION" });

  const res = await request(app).get(`/api/employees/${created.body.id}/salary-history`);
  expect(res.status).toBe(200);
  expect(res.body).toHaveLength(2);
  expect(res.body[0].changeReason).toBe("PROMOTION");
});

it("GET /api/employees/:id/salary-history returns 404 for an unknown employee", async () => {
  const res = await request(app).get("/api/employees/does-not-exist/salary-history");
  expect(res.status).toBe(404);
});
});