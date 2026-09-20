import "@testing-library/jest-dom/vitest";
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import EmployeeDetailPage from "./EmployeeDetailPage";

const mockEmployee = {
  id: "emp-1", employeeCode: "EMP-000001", firstName: "Ada", lastName: "Lovelace",
  email: "ada@acme.com", department: "Engineering", jobTitle: "Senior Software Engineer",
  level: "L4", country: "GB", countryName: "United Kingdom", currency: "USD",
  employmentType: "FULL_TIME", status: "ACTIVE", managerId: null, hireDate: "2024-01-15",
  baseSalaryAnnual: 95000, baseSalaryAnnualUsd: 95000,
  createdAt: "2024-01-15T00:00:00.000Z", updatedAt: "2024-01-15T00:00:00.000Z",
};

const mockHistory = [
  { id: "h1", previousSalary: null, newSalary: 95000, currency: "USD", changeReason: "INITIAL_HIRE", effectiveDate: "2024-01-15", changedBy: "Seed Script", createdAt: "2024-01-15T00:00:00.000Z" },
];

const mockMeta = {
  departments: ["Engineering"], levels: ["L4"], countries: [{ code: "GB", name: "United Kingdom" }],
  employmentTypes: ["FULL_TIME"], statuses: ["ACTIVE"],
  changeReasons: ["INITIAL_HIRE", "MERIT_INCREASE", "PROMOTION"],
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/employees/emp-1"]}>
        <Routes>
          <Route path="/employees/:id" element={<EmployeeDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("EmployeeDetailPage", () => {
  let currentEmployee = { ...mockEmployee };

  beforeEach(() => {
    currentEmployee = { ...mockEmployee };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes("/meta")) return { ok: true, json: async () => mockMeta } as Response;
        if (url.includes("/salary-history")) return { ok: true, json: async () => mockHistory } as Response;
        if (init?.method === "PATCH") {
          currentEmployee = {
            ...currentEmployee,
            baseSalaryAnnual: 105000,
            baseSalaryAnnualUsd: 105000,
            updatedAt: new Date().toISOString(),
          };
          return { ok: true, json: async () => currentEmployee } as Response;
        }
        if (url.includes("/employees/emp-1")) return { ok: true, json: async () => currentEmployee } as Response;
        return { ok: false, json: async () => ({ error: "not found" }) } as Response;
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders employee profile and current compensation", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "$95,000" })).toBeInTheDocument();
  });

  it("renders the salary history table", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Initial Hire")).toBeInTheDocument();
    });
  });

  it("submits a salary update and shows the new amount", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText("Ada Lovelace")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /update salary/i }));
    const input = screen.getByLabelText(/new annual salary/i);
    await user.clear(input);
    await user.type(input, "105000");
    await user.click(screen.getByRole("button", { name: /save change/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "$105,000" })).toBeInTheDocument();
    });
  });
});
