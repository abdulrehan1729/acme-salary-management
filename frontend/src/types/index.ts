export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  jobTitle: string;
  level: string;
  country: string;
  countryName: string;
  currency: string;
  employmentType: string;
  status: string;
  managerId: string | null;
  hireDate: string;
  baseSalaryAnnual: number;
  baseSalaryAnnualUsd: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedEmployees {
  data: Employee[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface SalaryHistoryEntry {
  id: string;
  previousSalary: number | null;
  newSalary: number;
  currency: string;
  changeReason: string;
  effectiveDate: string;
  changedBy: string;
  createdAt: string;
}

export interface GroupStats {
  key: string;
  headcount: number;
  totalUsd: number;
  averageUsd: number;
  medianUsd: number;
  minUsd: number;
  maxUsd: number;
}

export interface AnalyticsSummary {
  activeHeadcount: number;
  totalAnnualPayrollUsd: number;
  averageSalaryUsd: number;
  medianSalaryUsd: number;
}

export interface EmployeeFilters {
  q?: string;
  department?: string;
  country?: string;
  level?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "lastName" | "hireDate" | "salary" | "employeeCode";
  sortDir?: "asc" | "desc";
}