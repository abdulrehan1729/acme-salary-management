import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/vitest";
import EmployeeListPage from "./EmployeeListPage";

const mockEmployee = {
  id: "emp-1", employeeCode: "EMP-000001", firstName: "Ada", lastName: "Lovelace",
  email: "ada.lovelace@acme.com", department: "Engineering", jobTitle: "Senior Software Engineer",
  level: "L4", country: "GB", countryName: "United Kingdom", currency: "USD",
  employmentType: "FULL_TIME", status: "ACTIVE", managerId: null, hireDate: "2024-01-15",
  baseSalaryAnnual: 95000, baseSalaryAnnualUsd: 95000,
  createdAt: "2024-01-15T00:00:00.000Z", updatedAt: "2024-01-15T00:00:00.000Z",
};

const mockMeta = {
  departments: ["Engineering", "Sales"],
  levels: ["L1", "L2", "L3", "L4"],
  countries: [{ code: "GB", name: "United Kingdom" }],
  employmentTypes: ["FULL_TIME"],
  statuses: ["ACTIVE", "INACTIVE"],
  changeReasons: ["MERIT_INCREASE"],
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <EmployeeListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("EmployeeListPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/meta")) return { ok: true, json: async () => mockMeta } as Response;
        if (url.includes("/employees")) {
          return {
            ok: true,
            json: async () => ({ data: [mockEmployee], pagination: { page: 1, pageSize: 25, total: 1, totalPages: 1 } }),
          } as Response;
        }
        return { ok: false, json: async () => ({ error: "not found" }) } as Response;
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the fetched employee once loading completes", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    });
    expect(screen.getByText(/EMP-000001/)).toBeInTheDocument();
    expect(screen.getByText(/1 employees/)).toBeInTheDocument();
  });

  it("shows an empty state when no employees match", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
      if (url.includes("/meta")) return { ok: true, json: async () => mockMeta } as Response;
      return { ok: true, json: async () => ({ data: [], pagination: { page: 1, pageSize: 25, total: 0, totalPages: 1 } }) } as Response;
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/No employees match these filters/)).toBeInTheDocument();
    });
  });
});