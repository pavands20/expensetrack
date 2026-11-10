import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import { getSessionToken, setSessionToken } from "@/lib/api";

const user = {
  id: 1,
  name: "Priya",
  email: "p@example.com",
  role: "Employee",
  manager_id: null,
  manager_name: null,
  is_active: true,
};

function reply(status: number, body?: unknown) {
  return Promise.resolve(
    new Response(body === undefined ? null : JSON.stringify(body), { status }),
  );
}

function mount(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("App", () => {
  it("[AC-019] redirects to sign-in without a token", () => {
    mount("/dashboard");
    expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument();
  });

  it("[AC-019] renders the shell when /me succeeds", async () => {
    setSessionToken("t");
    vi.stubGlobal(
      "fetch",
      vi.fn(() => reply(200, user)),
    );
    mount("/dashboard");
    expect((await screen.findAllByText("My claims")).length).toBeGreaterThan(0);
  });

  it("[AC-022] a 401 from /me goes to sign-in with a notice", async () => {
    setSessionToken("t");
    vi.stubGlobal(
      "fetch",
      vi.fn(() => reply(401, { detail: "x" })),
    );
    mount("/dashboard");
    expect(await screen.findByText("Please sign in again")).toBeInTheDocument();
    expect(getSessionToken()).toBeNull();
  });

  it("[AC-017] signs in and goes to the dashboard", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        url.endsWith("/api/auth/login")
          ? reply(200, { token: "tok", token_type: "bearer", user })
          : reply(200, user),
      ),
    );
    mount("/sign-in");
    await userEvent.type(screen.getByPlaceholderText("Email"), "p@example.com");
    await userEvent.type(screen.getByPlaceholderText("Password"), "pw");
    await userEvent.click(screen.getByRole("button", { name: /^sign in/i }));
    await waitFor(() => expect(getSessionToken()).toBe("tok"));
    expect((await screen.findAllByText("My claims")).length).toBeGreaterThan(0);
  });

  it("[AC-018] shows one generic message on 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => reply(401, { detail: "Invalid email or password" })),
    );
    mount("/sign-in");
    await userEvent.type(screen.getByPlaceholderText("Email"), "p@example.com");
    await userEvent.type(screen.getByPlaceholderText("Password"), "pw");
    await userEvent.click(screen.getByRole("button", { name: /^sign in/i }));
    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
  });

  it("[AC-004] has no create-account control", () => {
    mount("/sign-in");
    expect(screen.queryByText(/register|sign up|create account/i)).toBeNull();
  });

  it("[AC-021] sign out clears the token even if the call fails", async () => {
    setSessionToken("t");
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        url.endsWith("/api/auth/logout") ? reply(500, {}) : reply(200, user),
      ),
    );
    mount("/dashboard");
    await screen.findAllByText("My claims");
    await userEvent.click(screen.getAllByRole("button", { name: "Sign out" })[0]);
    await waitFor(() => expect(getSessionToken()).toBeNull());
    expect(await screen.findByRole("heading", { name: /sign in/i })).toBeInTheDocument();
  });
});
