import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import NewEmployeePage from "./NewEmployeePage";

const mockMeta = {
  departments: ["Engineering"], levels: ["L4"], countries: [{ code: "US", name: "United States" }],
  employmentTypes: ["FULL_TIME"], statuses: ["ACTIVE"], changeReasons: ["INITIAL_HIRE"],
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <NewEmployeePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("NewEmployeePage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a validation error when department/level/country are missing", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("/meta")) return { ok: true, json: async () => mockMeta } as Response;
      return { ok: false, json: async () => ({}) } as Response;
    }));

    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByLabelText(/first name/i)).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /create employee/i }));

    expect(await screen.findByText(/choose department, level, and country/i)).toBeInTheDocument();
  });

  it("surfaces a server error (e.g. duplicate email) without crashing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes("/meta")) return { ok: true, json: async () => mockMeta } as Response;
        if (init?.method === "POST") {
          return { ok: false, json: async () => ({ error: "Email already in use" }) } as Response;
        }
        return { ok: false, json: async () => ({}) } as Response;
      }),
    );

    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByLabelText(/first name/i)).toBeInTheDocument());

    await user.type(screen.getByLabelText(/first name/i), "Ada");
    await user.type(screen.getByLabelText(/last name/i), "Lovelace");
    await user.type(screen.getByLabelText(/^email/i), "ada@acme.com");
    // MUI Select needs a click + option click rather than a plain type
    await user.click(screen.getByLabelText(/department/i));
    await user.click(await screen.findByRole("option", { name: "Engineering" }));
    await user.click(screen.getByLabelText(/^level/i));
    await user.click(await screen.findByRole("option", { name: "L4" }));
    await user.click(screen.getByLabelText(/country/i));
    await user.click(await screen.findByRole("option", { name: "United States" }));
    await user.type(screen.getByLabelText(/annual salary/i), "95000");

    await user.click(screen.getByRole("button", { name: /create employee/i }));

    expect(await screen.findByText(/email already in use/i)).toBeInTheDocument();
  });
});