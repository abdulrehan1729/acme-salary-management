import type {
  AnalyticsSummary,
  EmployeeFilters,
  Employee,
  GroupStats,
  PaginatedEmployees,
  SalaryHistoryEntry,
} from "../types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function toQueryString(filters: EmployeeFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  listEmployees: (filters: EmployeeFilters) =>
    request<PaginatedEmployees>(`/employees${toQueryString(filters)}`),

  getEmployee: (id: string) => request<Employee>(`/employees/${id}`),

  getSalaryHistory: (id: string) => request<SalaryHistoryEntry[]>(`/employees/${id}/salary-history`),

  createEmployee: (input: Record<string, unknown>) =>
    request<Employee>("/employees", { method: "POST", body: JSON.stringify(input) }),

  updateEmployee: (id: string, input: Record<string, unknown>) =>
    request<Employee>(`/employees/${id}`, { method: "PATCH", body: JSON.stringify(input) }),

  deactivateEmployee: (id: string) => request<Employee>(`/employees/${id}`, { method: "DELETE" }),

  getAnalyticsSummary: () => request<AnalyticsSummary>("/analytics/summary"),
  getAnalyticsByDepartment: () => request<GroupStats[]>("/analytics/by-department"),
  getAnalyticsByCountry: () => request<GroupStats[]>("/analytics/by-country"),
  getAnalyticsByLevel: () => request<GroupStats[]>("/analytics/by-level"),
};