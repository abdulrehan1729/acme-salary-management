import { describe, it, expect, beforeEach } from "vitest";
import type Database from "better-sqlite3";
import { createTestDb } from "./testDb";
import { EmployeeRepository } from "../repositories/employeeRepository";

function sampleEmployee(overrides: Partial<Parameters<EmployeeRepository["insert"]>[0]> = {}) {
    return {
        employee_code: "EMP-000001",
        first_name: "Ada",
        last_name: "Lovelace",
        email: "ada@acme.com",
        department: "Engineering",
        job_title: "Senior Software Engineer",
        level: "L4",
        country: "GB",
        country_name: "United Kingdom",
        currency: "USD",
        employment_type: "FULL_TIME",
        status: "ACTIVE",
        manager_id: null,
        hire_date: "2024-01-15",
        base_salary_annual: 95000,
        base_salary_annual_usd: 95000,
        ...overrides,
    };
}

describe("EmployeeRepository", () => {
    let db: Database.Database;
    let repo: EmployeeRepository;

    beforeEach(() => {
        db = createTestDb();
        repo = new EmployeeRepository(db);
    });

    describe("insert / findById", () => {
        it("inserts a row and can find it by id", () => {
            const created = repo.insert(sampleEmployee());
            const found = repo.findById(created.id);
            expect(found?.email).toBe("ada@acme.com");
            expect(found?.first_name).toBe("Ada");
        });

        it("generates a unique id per insert", () => {
            const a = repo.insert(sampleEmployee({ email: "a@acme.com", employee_code: "EMP-000001" }));
            const b = repo.insert(sampleEmployee({ email: "b@acme.com", employee_code: "EMP-000002" }));
            expect(a.id).not.toBe(b.id);
        });
    });

    describe("findByEmail", () => {
        it("finds an existing employee by email", () => {
            repo.insert(sampleEmployee());
            expect(repo.findByEmail("ada@acme.com")).toBeDefined();
        });

        it("returns undefined for an email that doesn't exist", () => {
            expect(repo.findByEmail("nobody@acme.com")).toBeUndefined();
        });
    });

    describe("nextEmployeeCode", () => {
        it("returns EMP-000001 when the table is empty", () => {
            expect(repo.nextEmployeeCode()).toBe("EMP-000001");
        });

        it("increments from the highest existing code", () => {
            repo.insert(sampleEmployee({ employee_code: "EMP-000007", email: "x@acme.com" }));
            expect(repo.nextEmployeeCode()).toBe("EMP-000008");
        });
    });

    describe("findMany — filtering", () => {
        beforeEach(() => {
            repo.insert(
                sampleEmployee({
                    employee_code: "EMP-000001",
                    email: "eng-us@acme.com",
                    department: "Engineering",
                    country: "US",
                }),
            );
            repo.insert(
                sampleEmployee({
                    employee_code: "EMP-000002",
                    email: "eng-gb@acme.com",
                    department: "Engineering",
                    country: "GB",
                }),
            );
            repo.insert(
                sampleEmployee({
                    employee_code: "EMP-000003",
                    email: "sales-us@acme.com",
                    department: "Sales",
                    country: "US",
                }),
            );
        });

        it("returns all rows with no filters", () => {
            const { rows, total } = repo.findMany({});
            expect(total).toBe(3);
            expect(rows).toHaveLength(3);
        });

        it("filters by department", () => {
            const { rows, total } = repo.findMany({ department: "Engineering" });
            expect(total).toBe(2);
            expect(rows.every((r) => r.department === "Engineering")).toBe(true);
        });

        it("filters by department AND country together", () => {
            const { rows, total } = repo.findMany({ department: "Engineering", country: "US" });
            expect(total).toBe(1);
            expect(rows[0].email).toBe("eng-us@acme.com");
        });

        it("searches case-insensitively across name/email/code", () => {
            const { rows } = repo.findMany({ q: "sales-us" });
            expect(rows).toHaveLength(1);
            expect(rows[0].department).toBe("Sales");
        });
    });

    describe("findMany — pagination", () => {
        beforeEach(() => {
            for (let i = 1; i <= 5; i++) {
                repo.insert(
                    sampleEmployee({
                        employee_code: `EMP-00000${i}`,
                        email: `p${i}@acme.com`,
                        last_name: `Person${i}`,
                    }),
                );
            }
        });

        it("respects pageSize", () => {
            const { rows, total } = repo.findMany({ page: 1, pageSize: 2 });
            expect(rows).toHaveLength(2);
            expect(total).toBe(5);
        });

        it("returns the second page correctly", () => {
            const page1 = repo.findMany({ page: 1, pageSize: 2, sortBy: "lastName" });
            const page2 = repo.findMany({ page: 2, pageSize: 2, sortBy: "lastName" });
            const overlap = page1.rows.filter((r1) => page2.rows.some((r2) => r2.id === r1.id));
            expect(overlap).toHaveLength(0);
        });
    });

    describe("update", () => {
        it("updates fields and returns the merged row", () => {
            const created = repo.insert(sampleEmployee());
            const updated = repo.update(created.id, { job_title: "Staff Engineer" });
            expect(updated?.job_title).toBe("Staff Engineer");
            expect(updated?.email).toBe(created.email);
        });

        it("returns undefined when updating a non-existent id", () => {
            expect(repo.update("does-not-exist", { job_title: "X" })).toBeUndefined();
        });
    });
    describe("findMany — search escapes SQL LIKE wildcards", () => {
        it("treats a literal % in the search term as a literal character, not a wildcard", () => {
            repo.insert(sampleEmployee({ employee_code: "EMP-000001", email: "a@acme.com", last_name: "50%Off" }));
            repo.insert(sampleEmployee({ employee_code: "EMP-000002", email: "b@acme.com", last_name: "Anyone" }));

            const { rows, total } = repo.findMany({ q: "50%" });
            expect(total).toBe(1);
            expect(rows[0].last_name).toBe("50%Off");
        });

        it("treats a literal _ in the search term as a literal character, not a single-char wildcard", () => {
            repo.insert(sampleEmployee({ employee_code: "EMP-000001", email: "a@acme.com", last_name: "Smith_Jones" }));
            repo.insert(sampleEmployee({ employee_code: "EMP-000002", email: "b@acme.com", last_name: "SmithXJones" }));

            const { rows, total } = repo.findMany({ q: "Smith_Jones" });
            expect(total).toBe(1);
            expect(rows[0].last_name).toBe("Smith_Jones");
        });
    });

    describe("findAllActive", () => {
  it("returns only ACTIVE employees", () => {
    repo.insert(sampleEmployee({ employee_code: "EMP-000001", email: "a@acme.com", status: "ACTIVE" }));
    repo.insert(sampleEmployee({ employee_code: "EMP-000002", email: "b@acme.com", status: "INACTIVE" }));
    const active = repo.findAllActive();
    expect(active).toHaveLength(1);
    expect(active[0].email).toBe("a@acme.com");
  });

  it("returns an empty array when there are no active employees", () => {
    repo.insert(sampleEmployee({ employee_code: "EMP-000001", email: "a@acme.com", status: "INACTIVE" }));
    expect(repo.findAllActive()).toEqual([]);
  });
});
});
