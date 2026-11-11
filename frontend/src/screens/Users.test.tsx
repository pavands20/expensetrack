import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "../App";
import { setSessionToken } from "../lib/api";

const mk = (id: number, name: string, role: string, active = true) => ({
  id,
  name,
  email: `${name.toLowerCase()}@x.io`,
  role,
  manager_id: null,
  is_active: active,
});
const me = mk(1, "Fin", "Finance");
const rows = [me, mk(2, "Bob", "Employee"), mk(3, "Old", "Employee", false)];

function reply(status: number, body?: unknown) {
  return new Response(JSON.stringify(body), { status });
}

function mount(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("Users admin", () => {
  beforeEach(() => {
    localStorage.clear();
    setSessionToken("t");
  });
  afterEach(() => vi.unstubAllGlobals());

  it("[AC-001] Finance sees the list with inactive badge and the nav link", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        Promise.resolve(url.endsWith("/api/users") ? reply(200, rows) : reply(200, me)),
      ),
    );
    mount("/admin/users");
    expect(await screen.findByText("Old")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
    expect(screen.getByText("Users", { selector: "a" })).toBeInTheDocument();
    expect(screen.getByTestId("deactivate-1")).toBeDisabled();
  });

  it("[AC-003] non-Finance is redirected to the dashboard", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reply(200, mk(2, "Bob", "Employee"))));
    mount("/admin/users");
    expect((await screen.findAllByText("My claims")).length).toBeGreaterThan(0);
    expect(screen.queryByText("Users", { selector: "a" })).toBeNull();
  });

  it("[AC-002] 409 shows the message by the email field", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        if (url.endsWith("/api/users"))
          return Promise.resolve(
            init?.method === "POST"
              ? reply(409, { detail: "A user with this email already exists" })
              : reply(200, rows),
          );
        return Promise.resolve(reply(200, me));
      }),
    );
    mount("/admin/users");
    await screen.findByText("Old");
    await userEvent.type(screen.getByTestId("new-name"), "Zed");
    await userEvent.type(screen.getByTestId("new-email"), "z@x.io");
    await userEvent.click(screen.getByTestId("create-submit"));
    expect(await screen.findByTestId("email-error")).toHaveTextContent(
      "A user with this email already exists",
    );
    expect(screen.getByTestId("new-name")).toHaveValue("Zed");
  });
});
