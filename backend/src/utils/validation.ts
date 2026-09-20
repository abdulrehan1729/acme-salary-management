import { z } from "zod";
import { DEPARTMENTS, LEVELS, EMPLOYMENT_TYPES, EMPLOYEE_STATUSES, SALARY_CHANGE_REASONS, COUNTRIES } from "./lookups";

const countryCodes = COUNTRIES.map((c) => c.code) as [string, ...string[]];
const nonInitialReasons = SALARY_CHANGE_REASONS.filter((r) => r !== "INITIAL_HIRE") as [string, ...string[]];

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  department: z.enum(DEPARTMENTS as unknown as [string, ...string[]]),
  jobTitle: z.string().min(1).max(150),
  level: z.enum(LEVELS as unknown as [string, ...string[]]),
  country: z.enum(countryCodes),
  employmentType: z.enum(EMPLOYMENT_TYPES as unknown as [string, ...string[]]).default("FULL_TIME"),
  status: z.enum(EMPLOYEE_STATUSES as unknown as [string, ...string[]]).default("ACTIVE"),
  managerId: z.string().nullable().optional(),
  hireDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date"),
  baseSalaryAnnual: z.number().positive(),
  changedBy: z.string().min(1).max(100).default("HR Manager"),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  changeReason: z.enum(nonInitialReasons).optional(),
  effectiveDate: z.string().optional(),
});

export const employeeQuerySchema = z.object({
  q: z.string().optional(),
  department: z.string().optional(),
  country: z.string().optional(),
  level: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
  sortBy: z.enum(["lastName", "hireDate", "salary", "employeeCode"]).default("lastName"),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;