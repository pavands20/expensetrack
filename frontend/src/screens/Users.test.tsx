import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import Users, { type User } from "./Users";

const mk = (id: number, name: string, extra: Partial<User> = {}): User => ({
  id,
  name,
  email: `${name}@x.co`,
  role: "employee",
  manager_id: null,
  is_active: true,
  ...extra,
});
const res = (status: number, body?: unknown) =>
  Promise.resolve(new Response(body === undefined ? null : JSON.stringify(body), { status }));

function setup(handler: (url: string, init?: RequestInit) => Promise<Response>) {
  const f = vi.fn(handler);
  vi.stubGlobal("fetch", f);
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <Users />
    </QueryClientProvider>,
  );
  return f;
}

afterEach(() => vi.unstubAllGlobals());

describe("Users", () => {
  it("[AC-001] lists users with manager name and status", async () => {
    setup(() => res(200, [mk(1, "Boss"), mk(2, "Zed", { manager_id: 1, is_active: false })]));
    const row = (await screen.findByText("Zed@x.co")).closest("tr")!;
    expect(within(row).getByText("Boss")).toBeInTheDocument();
    expect(within(row).getByText("Inactive")).toBeInTheDocument();
  });

  it("[AC-001] shows the error state", async () => {
    setup(() => res(403, { detail: "Forbidden" }));
    expect(await screen.findByText("You do not have permission to do that")).toBeInTheDocument();
  });

  it("[AC-002] a 409 on create shows the message inline", async () => {
    setup((_u, init) =>
      init?.method === "POST"
        ? res(409, { detail: "A user with this email already exists" })
        : res(200, [mk(1, "Boss")]),
    );
    await screen.findByText("Boss@x.co");
    await userEvent.type(screen.getByLabelText("Name"), "N");
    await userEvent.type(screen.getByLabelText("Email"), "n@x.co");
    await userEvent.type(screen.getByLabelText("Initial password"), "longenough1");
    await userEvent.click(screen.getByTestId("create-user"));
    expect(await screen.findByText("A user with this email already exists")).toBeInTheDocument();
  });

  it("[AC-006] edit excludes self and inactive users from manager choices", async () => {
    setup(() => res(200, [mk(1, "Boss"), mk(2, "Zed"), mk(3, "Gone", { is_active: false })]));
    await screen.findByText("Zed@x.co");
    await userEvent.click(screen.getByRole("button", { name: "Edit Zed" }));
    const options = within(screen.getByTestId("edit-manager"))
      .getAllByRole("option")
      .map((o) => o.textContent);
    expect(options).toEqual(["No manager", "Boss"]);
  });

  it("[AC-009] deactivate asks for confirmation then posts", async () => {
    const f = setup((_u, init) =>
      init?.method === "POST" ? res(200, mk(2, "Zed", { is_active: false })) : res(200, [mk(2, "Zed")]),
    );
    await screen.findByText("Zed@x.co");
    await userEvent.click(screen.getByRole("button", { name: "Deactivate Zed" }));
    await userEvent.click(screen.getByRole("button", { name: "Confirm deactivate Zed" }));
    expect(f.mock.calls.some(([u]) => String(u).endsWith("/api/users/2/deactivate"))).toBe(true);
  });
});
