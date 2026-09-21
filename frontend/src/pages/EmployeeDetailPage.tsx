import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    MenuItem,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { formatDate, formatUsd, titleCase } from "../utils/format";

export default function EmployeeDetailPage() {
    const { id = "" } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const employeeQuery = useQuery({ queryKey: ["employee", id], queryFn: () => api.getEmployee(id) });
    const historyQuery = useQuery({ queryKey: ["salary-history", id], queryFn: () => api.getSalaryHistory(id) });
    const metaQuery = useQuery({ queryKey: ["meta"], queryFn: api.getMeta });

    const [editingSalary, setEditingSalary] = useState(false);
    const [newSalary, setNewSalary] = useState("");
    const [changeReason, setChangeReason] = useState("MERIT_INCREASE");
    const [changedBy, setChangedBy] = useState("HR Manager");
    const [formError, setFormError] = useState<string | null>(null);

    const updateMutation = useMutation({
        mutationFn: (payload: Record<string, unknown>) => api.updateEmployee(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employee", id] });
            queryClient.invalidateQueries({ queryKey: ["salary-history", id] });
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            setEditingSalary(false);
            setFormError(null);
        },
        onError: (err: Error) => setFormError(err.message),
    });

    const deactivateMutation = useMutation({
        mutationFn: () => api.deactivateEmployee(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employee", id] });
            queryClient.invalidateQueries({ queryKey: ["employees"] });
        },
    });

    if (employeeQuery.isLoading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (employeeQuery.isError || !employeeQuery.data) {
        return <Alert severity="error">Employee not found.</Alert>;
    }

    const employee = employeeQuery.data;

    function submitSalaryChange() {
        const amount = Number(newSalary);
        if (!amount || amount <= 0) {
            setFormError("Enter a valid positive salary.");
            return;
        }
        updateMutation.mutate({
            baseSalaryAnnual: amount,
            changeReason,
            changedBy,
            effectiveDate: new Date().toISOString().slice(0, 10),
        });
    }

    return (
        <Box>
            <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>
                &larr; Back
            </Button>

            <Grid container spacing={3}>
                <Grid item xs={12} md={5}>
                    {" "}
                    <Paper variant="outlined" sx={{ p: 3 }}>
                        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                    {employee.firstName} {employee.lastName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {employee.jobTitle} &middot; {employee.department}
                                </Typography>
                            </Box>
                            <Chip
                                label={titleCase(employee.status)}
                                color={employee.status === "ACTIVE" ? "success" : "default"}
                                size="small"
                            />
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        <Stack spacing={1.5}>
                            <Field label="Employee ID" value={employee.employeeCode} />
                            <Field label="Email" value={employee.email} />
                            <Field label="Level" value={employee.level} />
                            <Field label="Country" value={`${employee.countryName} (${employee.country})`} />
                            <Field label="Employment Type" value={titleCase(employee.employmentType)} />
                            <Field label="Hire Date" value={formatDate(employee.hireDate)} />
                        </Stack>

                        {employee.status === "ACTIVE" && (
                            <Button
                                sx={{ mt: 3 }}
                                color="error"
                                variant="outlined"
                                size="small"
                                onClick={() => deactivateMutation.mutate()}
                                disabled={deactivateMutation.isPending}
                            >
                                Mark as Offboarded
                            </Button>
                        )}
                    </Paper>
                </Grid>

                <Grid item xs={12} md={7}>
                    {" "}
                    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                            <Typography variant="h6">Current Compensation</Typography>
                            {!editingSalary && (
                                <Button
                                    size="small"
                                    onClick={() => {
                                        setEditingSalary(true);
                                        setNewSalary(String(employee.baseSalaryAnnual));
                                    }}
                                >
                                    Update Salary
                                </Button>
                            )}
                        </Stack>

                        <Typography variant="h4" sx={{ fontWeight: 700, color: "primary.main" }}>
                            {formatUsd(employee.baseSalaryAnnualUsd)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            per year
                        </Typography>

                        {editingSalary && (
                            <Box sx={{ mt: 3 }}>
                                {formError && (
                                    <Alert severity="error" sx={{ mb: 2 }}>
                                        {formError}
                                    </Alert>
                                )}
                                <Stack spacing={2}>
                                    <TextField
                                        label="New annual salary (USD)"
                                        type="number"
                                        size="small"
                                        value={newSalary}
                                        onChange={(e) => setNewSalary(e.target.value)}
                                    />
                                    <TextField
                                        select
                                        label="Reason"
                                        size="small"
                                        value={changeReason}
                                        onChange={(e) => setChangeReason(e.target.value)}
                                    >
                                        {(
                                            metaQuery.data?.changeReasons ?? [
                                                "MERIT_INCREASE",
                                                "PROMOTION",
                                                "MARKET_ADJUSTMENT",
                                                "CORRECTION",
                                            ]
                                        )
                                            .filter((r) => r !== "INITIAL_HIRE")
                                            .map((r) => (
                                                <MenuItem key={r} value={r}>
                                                    {titleCase(r)}
                                                </MenuItem>
                                            ))}
                                    </TextField>
                                    <TextField
                                        label="Changed by"
                                        size="small"
                                        value={changedBy}
                                        onChange={(e) => setChangedBy(e.target.value)}
                                    />
                                    <Stack direction="row" spacing={1}>
                                        <Button
                                            variant="contained"
                                            onClick={submitSalaryChange}
                                            disabled={updateMutation.isPending}
                                        >
                                            Save Change
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setEditingSalary(false);
                                                setFormError(null);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </Stack>
                                </Stack>
                            </Box>
                        )}
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Salary History
                        </Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Effective Date</TableCell>
                                    <TableCell>Reason</TableCell>
                                    <TableCell align="right">Previous</TableCell>
                                    <TableCell align="right">New</TableCell>
                                    <TableCell>Changed By</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {historyQuery.data?.map((h) => (
                                    <TableRow key={h.id}>
                                        <TableCell>{formatDate(h.effectiveDate)}</TableCell>
                                        <TableCell>
                                            <Chip label={titleCase(h.changeReason)} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell align="right">
                                            {h.previousSalary !== null ? formatUsd(h.previousSalary) : "—"}
                                        </TableCell>
                                        <TableCell align="right">{formatUsd(h.newSalary)}</TableCell>
                                        <TableCell>{h.changedBy}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
            <Typography variant="body2" color="text.secondary">
                {label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {value}
            </Typography>
        </Stack>
    );
}
