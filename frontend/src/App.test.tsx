import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import { setSessionToken } from "@/lib/api";

function reply(status: number, body?: unknown) {
  return Promise.resolve(new Response(body === undefined ? null : JSON.stringify(body), { status }));
}
const user = (role: string) => ({
  id: 1,
  name: "Ann",
  email: "a@x.co",
  role,
  manager_id: null,
  is_active: true,
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("App", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it("[AC-019] redirects unauthenticated visitors to sign-in", async () => {
    renderAt("/dashboard");
    expect(await screen.findByText("Sign in to ExpenseTrack")).toBeInTheDocument();
  });

  it("[AC-019] a 401 from me clears the token and goes to sign-in", async () => {
    setSessionToken(crypto.randomUUID());
    vi.stubGlobal(
      "fetch",
      vi.fn(() => reply(401, { detail: "x" })),
    );
    renderAt("/dashboard");
    expect(await screen.findByText("Sign in to ExpenseTrack")).toBeInTheDocument();
    expect(localStorage.getItem("session_token")).toBeNull();
  });

  it("[AC-003] employees do not see Users and are redirected from admin", async () => {
    setSessionToken(crypto.randomUUID());
    vi.stubGlobal(
      "fetch",
      vi.fn(() => reply(200, user("employee"))),
    );
    renderAt("/admin/users");
    expect((await screen.findAllByText("My claims")).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "Users" })).toBeNull();
  });

  it("[AC-003] finance sees the Users link and screen", async () => {
    setSessionToken(crypto.randomUUID());
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        String(url).endsWith("/api/users") ? reply(200, []) : reply(200, user("finance")),
      ),
    );
    renderAt("/admin/users");
    expect(await screen.findByRole("link", { name: "Users" })).toBeInTheDocument();
    expect(await screen.findByText("No users yet")).toBeInTheDocument();
  });

  it("[AC-021] sign out calls logout, clears the token and leaves", async () => {
    setSessionToken(crypto.randomUUID());
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        String(url).endsWith("/logout") ? reply(500) : reply(200, user("employee")),
      ),
    );
    renderAt("/dashboard");
    // The shell's control comes first in the DOM; Dashboard carries its own placeholder.
    const buttons = await screen.findAllByRole("button", { name: "Sign out" });
    await userEvent.click(buttons[0]);
    await waitFor(() => expect(localStorage.getItem("session_token")).toBeNull());
    expect(await screen.findByText("Sign in to ExpenseTrack")).toBeInTheDocument();
  });

  it("[AC-018] [AC-004] sign-in shows a generic error on 401 and has no sign-up", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => reply(401, { detail: "Invalid email or password" })),
    );
    renderAt("/sign-in");
    expect(screen.queryByText("Create account")).toBeNull();
    expect(screen.queryByText("Google")).toBeNull();
    await userEvent.type(screen.getByLabelText("Email"), "a@x.co");
    await userEvent.type(screen.getByLabelText("Password"), "whatever1");
    await userEvent.click(screen.getByRole("button", { name: /Sign in/ }));
    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
  });

  it("[AC-017] successful login stores the token and opens the dashboard", async () => {
    const token = crypto.randomUUID();
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        String(url).endsWith("/login")
          ? reply(200, { token, token_type: "bearer", user: user("employee") })
          : reply(200, user("employee")),
      ),
    );
    renderAt("/sign-in");
    await userEvent.type(screen.getByLabelText("Email"), "a@x.co");
    await userEvent.type(screen.getByLabelText("Password"), "whatever1");
    await userEvent.click(screen.getByRole("button", { name: /Sign in/ }));
    expect((await screen.findAllByText("My claims")).length).toBeGreaterThan(0);
    expect(localStorage.getItem("session_token")).toBe(token);
  });
});
