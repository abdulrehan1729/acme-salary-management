import { useState } from "react";
import { Alert, Box, Button, Grid, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  jobTitle: string;
  level: string;
  country: string;
  employmentType: string;
  hireDate: string;
  baseSalaryAnnual: string;
  changedBy: string;
}

const EMPTY: FormState = {
  firstName: "", lastName: "", email: "", department: "", jobTitle: "", level: "",
  country: "", employmentType: "FULL_TIME", hireDate: new Date().toISOString().slice(0, 10),
  baseSalaryAnnual: "", changedBy: "HR Manager",
};

export default function NewEmployeePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: meta } = useQuery({ queryKey: ["meta"], queryFn: api.getMeta });
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.createEmployee(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      navigate(`/employees/${created.id}`);
    },
    onError: (err: Error) => setError(err.message),
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit() {
    setError(null);
    if (!form.department || !form.level || !form.country) {
      setError("Please choose department, level, and country.");
      return;
    }
    const salary = Number(form.baseSalaryAnnual);
    if (!salary || salary <= 0) {
      setError("Enter a valid positive salary.");
      return;
    }
    mutation.mutate({ ...form, baseSalaryAnnual: salary });
  }

  return (
    <Box maxWidth={720}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Add New Employee</Typography>

      <Paper variant="outlined" sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField label="First name" fullWidth size="small" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Last name" fullWidth size="small" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Email" fullWidth size="small" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </Grid>
          <Grid item xs={6}>
            <TextField select label="Department" fullWidth size="small" value={form.department} onChange={(e) => set("department", e.target.value)}>
              {meta?.departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField label="Job title" fullWidth size="small" value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} />
          </Grid>
          <Grid item xs={6}>
            <TextField select label="Level" fullWidth size="small" value={form.level} onChange={(e) => set("level", e.target.value)}>
              {meta?.levels.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField select label="Country" fullWidth size="small" value={form.country} onChange={(e) => set("country", e.target.value)}>
              {meta?.countries.map((c) => <MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField select label="Employment type" fullWidth size="small" value={form.employmentType} onChange={(e) => set("employmentType", e.target.value)}>
              {meta?.employmentTypes.map((t) => <MenuItem key={t} value={t}>{t.replace("_", " ")}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField label="Hire date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }}
              value={form.hireDate} onChange={(e) => set("hireDate", e.target.value)} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Annual salary (USD)" type="number" fullWidth size="small"
              value={form.baseSalaryAnnual} onChange={(e) => set("baseSalaryAnnual", e.target.value)} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Added by" fullWidth size="small" value={form.changedBy} onChange={(e) => set("changedBy", e.target.value)} />
          </Grid>
        </Grid>

        <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
          <Button variant="contained" onClick={handleSubmit} disabled={mutation.isPending}>Create Employee</Button>
          <Button onClick={() => navigate(-1)}>Cancel</Button>
        </Stack>
      </Paper>
    </Box>
  );
}