import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import AnalyticsPage from "./AnalyticsPage";

const mockSummary = {
  activeHeadcount: 9700,
  totalAnnualPayrollUsd: 690_000_000,
  averageSalaryUsd: 71_000,
  medianSalaryUsd: 65_000,
};

const mockByDepartment = [
  { key: "Engineering", headcount: 3200, totalUsd: 300_000_000, averageUsd: 93_750, medianUsd: 90_000, minUsd: 45_000, maxUsd: 280_000 },
  { key: "Sales", headcount: 1600, totalUsd: 90_000_000, averageUsd: 56_250, medianUsd: 52_000, minUsd: 45_000, maxUsd: 180_000 },
];

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AnalyticsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AnalyticsPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders summary cards and the default department breakdown", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/analytics/summary")) return { ok: true, json: async () => mockSummary } as Response;
        if (url.includes("/analytics/by-department")) return { ok: true, json: async () => mockByDepartment } as Response;
        if (url.includes("/analytics/by-country") || url.includes("/analytics/by-level")) {
          return { ok: true, json: async () => [] } as Response;
        }
        return { ok: false, json: async () => ({}) } as Response;
      }),
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("9,700")).toBeInTheDocument();
    });
    expect(screen.getByText("$690,000,000")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("Sales")).toBeInTheDocument();
  });

  it("shows a loading indicator before data arrives", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {}))); // never resolves
    renderPage();
    expect(screen.getAllByRole("progressbar").length).toBeGreaterThan(0);
  });
});