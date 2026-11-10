import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import { getSessionToken, setSessionToken } from "./lib/api";

const USER = {
  id: 1,
  name: "Priya Raman",
  email: "p@x.com",
  role: "employee",
  manager_id: null,
  is_active: true,
};

function reply(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), { status });
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => sessionStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("App", () => {
  it("[AC-019] redirects to sign-in when signed out", () => {
    renderAt("/dashboard");
    expect(screen.getByRole("heading", { name: /sign in to expensetrack/i })).toBeInTheDocument();
  });

  it("[AC-019] unknown paths go to sign-in", () => {
    renderAt("/nowhere");
    expect(screen.getByRole("heading", { name: /sign in to expensetrack/i })).toBeInTheDocument();
  });

  it("[AC-019] a 401 from /api/auth/me redirects to sign-in", async () => {
    setSessionToken("t");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(reply(401, { detail: "x" }));
    renderAt("/dashboard");
    expect(
      await screen.findByRole("heading", { name: /sign in to expensetrack/i }),
    ).toBeInTheDocument();
  });

  it("[AC-017] successful sign-in stores the token and opens the dashboard", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(reply(200, { token: "tok", token_type: "bearer", user: USER }));
    renderAt("/sign-in");
    await userEvent.type(screen.getByPlaceholderText("Email"), "p@x.com");
    await userEvent.type(screen.getByPlaceholderText("Password"), "pw");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByText(/Priya Raman \(employee\)/)).toBeInTheDocument();
    expect(getSessionToken()).toBe("tok");
    expect(String(fetchMock.mock.calls[0][0])).toContain("/api/auth/login");
  });

  it("[AC-018] failed sign-in shows one generic message and stores no token", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      reply(401, { detail: "Invalid email or password" }),
    );
    renderAt("/sign-in");
    await userEvent.type(screen.getByPlaceholderText("Email"), "p@x.com");
    await userEvent.type(screen.getByPlaceholderText("Password"), "bad");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
    expect(getSessionToken()).toBeNull();
  });

  it("[AC-004] sign-in page has no register or social controls", () => {
    renderAt("/sign-in");
    expect(screen.queryByText(/create account/i)).toBeNull();
    expect(screen.queryByText("Google")).toBeNull();
    expect(screen.queryByText("Apple")).toBeNull();
    expect(screen.getByText("Forgot your password?")).toBeInTheDocument();
  });

  it("[AC-021] sign out calls logout, clears the token and returns to sign-in", async () => {
    setSessionToken("t");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(reply(200, USER))
      .mockResolvedValueOnce(reply(204));
    renderAt("/dashboard");
    await userEvent.click(await screen.findByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(getSessionToken()).toBeNull());
    expect(String(fetchMock.mock.calls[1][0])).toContain("/api/auth/logout");
    expect(
      await screen.findByRole("heading", { name: /sign in to expensetrack/i }),
    ).toBeInTheDocument();
  });
});
