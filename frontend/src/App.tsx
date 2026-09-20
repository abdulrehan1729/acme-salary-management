import {
    AppBar,
    Box,
    Button,
    Container,
    CssBaseline,
    Tab,
    Tabs,
    ThemeProvider,
    Toolbar,
    Typography,
    createTheme,
} from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import EmployeeListPage from "./pages/EmployeeListPage";
import EmployeeDetailPage from "./pages/EmployeeDetailPage";
const theme = createTheme({
    palette: {
        mode: "light",
        primary: { main: "#1a4d3e" },
        secondary: { main: "#c9a227" },
        background: { default: "#f5f6f5" },
    },
    shape: { borderRadius: 8 },
});

const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function NavTabs() {
    const location = useLocation();
    const navigate = useNavigate();
    const current = location.pathname.startsWith("/analytics") ? "/analytics" : "/";

    return (
        <Tabs
            value={current}
            onChange={(_e, value) => navigate(value)}
            textColor="inherit"
            indicatorColor="secondary"
            sx={{ flexGrow: 1, ml: 4 }}
        >
            <Tab label="Employees" value="/" />
            <Tab label="Analytics" value="/analytics" />
        </Tabs>
    );
}

function AppShell() {
    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
            <AppBar position="sticky" elevation={0} color="primary">
                <Toolbar>
                    <Typography
                        variant="h6"
                        component={Link}
                        to="/"
                        sx={{ color: "inherit", textDecoration: "none", fontWeight: 700 }}
                    >
                        ACME Salary Management
                    </Typography>
                    <NavTabs />
                    <Button component={Link} to="/employees/new" color="secondary" variant="contained" size="small">
                        + New Employee
                    </Button>
                </Toolbar>
            </AppBar>

            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Routes>
                    <Route path="/" element={<EmployeeListPage />} />{" "}
                    <Route path="/employees/new" element={<div>New employee form — coming later</div>} />
                    <Route path="/employees/:id" element={<EmployeeDetailPage />} />
                    <Route path="/analytics" element={<div>Analytics — coming later</div>} />
                </Routes>
            </Container>
        </Box>
    );
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <BrowserRouter>
                    <AppShell />
                </BrowserRouter>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
