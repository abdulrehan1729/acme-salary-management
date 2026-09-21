import { Box, CircularProgress, Grid, Paper, Table, TableBody, TableCell, TableHead, TableRow, Tabs, Tab, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "../api/client";
import { formatUsd } from "../utils/format";
import type { GroupStats } from "../types";

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, height: "100%" }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>{value}</Typography>
      {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
    </Paper>
  );
}

function BreakdownChart({ data }: { data: GroupStats[] }) {
  const chartData = data.map((g) => ({ name: g.key, average: g.averageUsd }));
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} margin={{ top: 8, right: 24, left: 8, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} height={80} tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} width={60} />
        <Tooltip formatter={(value: number) => formatUsd(value)} />
        <Bar dataKey="average" fill="#1a4d3e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function BreakdownTable({ data, keyLabel }: { data: GroupStats[]; keyLabel: string }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>{keyLabel}</TableCell>
          <TableCell align="right">Headcount</TableCell>
          <TableCell align="right">Average</TableCell>
          <TableCell align="right">Median</TableCell>
          <TableCell align="right">Min</TableCell>
          <TableCell align="right">Max</TableCell>
          <TableCell align="right">Total Payroll</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((g) => (
          <TableRow key={g.key}>
            <TableCell>{g.key}</TableCell>
            <TableCell align="right">{g.headcount.toLocaleString()}</TableCell>
            <TableCell align="right">{formatUsd(g.averageUsd)}</TableCell>
            <TableCell align="right">{formatUsd(g.medianUsd)}</TableCell>
            <TableCell align="right">{formatUsd(g.minUsd)}</TableCell>
            <TableCell align="right">{formatUsd(g.maxUsd)}</TableCell>
            <TableCell align="right">{formatUsd(g.totalUsd)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function AnalyticsPage() {
  const [tab, setTab] = useState<"department" | "country" | "level">("department");

  const summaryQuery = useQuery({ queryKey: ["analytics", "summary"], queryFn: api.getAnalyticsSummary });
  const byDeptQuery = useQuery({ queryKey: ["analytics", "byDept"], queryFn: api.getAnalyticsByDepartment });
  const byCountryQuery = useQuery({ queryKey: ["analytics", "byCountry"], queryFn: api.getAnalyticsByCountry });
  const byLevelQuery = useQuery({ queryKey: ["analytics", "byLevel"], queryFn: api.getAnalyticsByLevel });

  const activeQuery = tab === "department" ? byDeptQuery : tab === "country" ? byCountryQuery : byLevelQuery;
  const keyLabel = tab === "department" ? "Department" : tab === "country" ? "Country" : "Level";

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>Compensation Analytics</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        How ACME pays its people.
      </Typography>

      {summaryQuery.isLoading ? (
        <CircularProgress />
      ) : summaryQuery.data ? (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard label="Active Headcount" value={summaryQuery.data.activeHeadcount.toLocaleString()} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard label="Total Annual Payroll" value={formatUsd(summaryQuery.data.totalAnnualPayrollUsd)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard label="Average Salary" value={formatUsd(summaryQuery.data.averageSalaryUsd)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard label="Median Salary" value={formatUsd(summaryQuery.data.medianSalaryUsd)} />
          </Grid>
        </Grid>
      ) : null}

      <Paper variant="outlined">
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ px: 2, pt: 1 }}>
          <Tab label="By Department" value="department" />
          <Tab label="By Country" value="country" />
          <Tab label="By Level" value="level" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeQuery.isLoading ? (
            <CircularProgress />
          ) : activeQuery.data ? (
            <>
              <BreakdownChart data={activeQuery.data} />
              <Box sx={{ mt: 3, overflowX: "auto" }}>
                <BreakdownTable data={activeQuery.data} keyLabel={keyLabel} />
              </Box>
            </>
          ) : null}
        </Box>
      </Paper>
    </Box>
  );
}