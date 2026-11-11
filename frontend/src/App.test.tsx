import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import { getSessionToken, setSessionToken } from "./lib/api";

const user = {
  id: 1,
  name: "A",
  email: "a@x.io",
  role: "Employee",
  manager_id: null,
  is_active: true,
};

function reply(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), { status });
}

function mount(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("App", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it("[AC-019] renders the shell when signed in", async () => {
    setSessionToken("t");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reply(200, user)));
    mount("/dashboard");
    expect((await screen.findAllByText("My claims")).length).toBeGreaterThan(0);
  });

  it("[AC-019] redirects to sign-in with no token", async () => {
    mount("/dashboard");
    expect(await screen.findByTestId("submit")).toBeInTheDocument();
  });

  it("[AC-022] shows the notice when me returns 401", async () => {
    setSessionToken("t");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reply(401, { detail: "x" })));
    mount("/dashboard");
    expect(await screen.findByText("Please sign in again")).toBeInTheDocument();
    expect(getSessionToken()).toBeNull();
  });

  it("[AC-017] logs in and stores the token", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(reply(200, { token: "abc", token_type: "bearer", user }))
      .mockResolvedValue(reply(200, user));
    vi.stubGlobal("fetch", fetchMock);
    mount("/sign-in");
    await userEvent.type(screen.getByTestId("email"), "a@x.io");
    await userEvent.type(screen.getByTestId("password"), "pw123456");
    await userEvent.click(screen.getByTestId("submit"));
    await waitFor(() => expect(getSessionToken()).toBe("abc"));
    expect((await screen.findAllByText("My claims")).length).toBeGreaterThan(0);
  });

  it("[AC-018] shows a generic error on 401 and stores no token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(reply(401, { detail: "Invalid email or password" })),
    );
    mount("/sign-in");
    await userEvent.type(screen.getByTestId("email"), "a@x.io");
    await userEvent.type(screen.getByTestId("password"), "pw123456");
    await userEvent.click(screen.getByTestId("submit"));
    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
    expect(getSessionToken()).toBeNull();
  });

  it("[AC-004] has no sign-up controls", () => {
    mount("/sign-in");
    expect(screen.getByText("Accounts are created by Finance.")).toBeInTheDocument();
    expect(screen.queryByText(/create account/i)).toBeNull();
    expect(screen.queryByText("Google")).toBeNull();
  });

  it("[AC-021] sign out clears the token even if logout fails", async () => {
    setSessionToken("t");
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        Promise.resolve(
          url.endsWith("/logout") ? reply(500, { detail: "boom" }) : reply(200, user),
        ),
      ),
    );
    mount("/dashboard");
    await userEvent.click(await screen.findByTestId("sign-out"));
    expect(await screen.findByTestId("submit")).toBeInTheDocument();
    expect(getSessionToken()).toBeNull();
  });

  it("[AC-020] reset confirm shows the invalid-link message on 400", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(reply(400, { detail: "Reset link is invalid or has expired" })),
    );
    mount("/reset-password?token=zz");
    await userEvent.type(screen.getByTestId("password"), "longenough1");
    await userEvent.type(screen.getByTestId("confirm"), "longenough1");
    await userEvent.click(screen.getByTestId("submit"));
    expect(await screen.findByText("Reset link is invalid or has expired")).toBeInTheDocument();
  });
});
