import { useMemo, useState } from "react";
import {
  Box, Chip, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TablePagination, TableRow, TextField, Typography,
  CircularProgress, Alert,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { EmployeeFilters } from "../types";
import { formatUsd, formatDate, titleCase } from "../utils/format";

const PAGE_SIZE = 25;

export default function EmployeeListPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [department, setDepartment] = useState("");
  const [country, setCountry] = useState("");
  const [level, setLevel] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [page, setPage] = useState(0); // MUI TablePagination is 0-indexed

  const filters: EmployeeFilters = useMemo(
    () => ({
      q: q || undefined,
      department: department || undefined,
      country: country || undefined,
      level: level || undefined,
      status: status || undefined,
      page: page + 1,
      pageSize: PAGE_SIZE,
      sortBy: "lastName",
      sortDir: "asc",
    }),
    [q, department, country, level, status, page],
  );

  const { data: meta } = useQuery({ queryKey: ["meta"], queryFn: api.getMeta });
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["employees", filters],
    queryFn: () => api.listEmployees(filters),
  });

  function resetToFirstPage<T>(setter: (v: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(0);
    };
  }

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-end", mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Employee Directory</Typography>
          <Typography variant="body2" color="text.secondary">
            {data ? `${data.pagination.total.toLocaleString()} employees` : "Loading..."}
          </Typography>
        </Box>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="Search name, email, or ID"
            size="small"
            fullWidth
            value={q}
            onChange={(e) => resetToFirstPage(setQ)(e.target.value)}
          />
          <Select size="small" displayEmpty value={department} onChange={(e) => resetToFirstPage(setDepartment)(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="">All Departments</MenuItem>
            {meta?.departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
          </Select>
          <Select size="small" displayEmpty value={country} onChange={(e) => resetToFirstPage(setCountry)(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="">All Countries</MenuItem>
            {meta?.countries.map((c) => <MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>)}
          </Select>
          <Select size="small" displayEmpty value={level} onChange={(e) => resetToFirstPage(setLevel)(e.target.value)} sx={{ minWidth: 120 }}>
            <MenuItem value="">All Levels</MenuItem>
            {meta?.levels.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
          </Select>
          <Select size="small" value={status} onChange={(e) => resetToFirstPage(setStatus)(e.target.value)} sx={{ minWidth: 140 }}>
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="INACTIVE">Inactive</MenuItem>
          </Select>
        </Stack>
      </Paper>

      {isError && <Alert severity="error" sx={{ mb: 2 }}>{(error as Error).message}</Alert>}

      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Country</TableCell>
                <TableCell align="right">Salary</TableCell>
                <TableCell>Hired</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && data?.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    No employees match these filters.
                  </TableCell>
                </TableRow>
              )}
              {data?.data.map((emp) => (
                <TableRow key={emp.id} hover onClick={() => navigate(`/employees/${emp.id}`)} sx={{ cursor: "pointer" }}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{emp.firstName} {emp.lastName}</Typography>
                    <Typography variant="caption" color="text.secondary">{emp.employeeCode} &middot; {emp.email}</Typography>
                  </TableCell>
                  <TableCell>{emp.department}</TableCell>
                  <TableCell>{emp.jobTitle}</TableCell>
                  <TableCell>{emp.level}</TableCell>
                  <TableCell>{emp.countryName}</TableCell>
                  <TableCell align="right">{formatUsd(emp.baseSalaryAnnualUsd)}</TableCell>
                  <TableCell>{formatDate(emp.hireDate)}</TableCell>
                  <TableCell>
                    <Chip label={titleCase(emp.status)} size="small" color={emp.status === "ACTIVE" ? "success" : "default"} variant="outlined" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {data && (
          <TablePagination
            component="div"
            count={data.pagination.total}
            page={page}
            onPageChange={(_e, newPage) => setPage(newPage)}
            rowsPerPage={PAGE_SIZE}
            rowsPerPageOptions={[PAGE_SIZE]}
          />
        )}
      </Paper>
    </Box>
  );
}
