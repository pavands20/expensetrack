import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "../App";
import { setSessionToken } from "../lib/api";

const me = {
  id: 1,
  name: "Fin",
  email: "f@x.io",
  role: "Finance",
  manager_id: null,
  is_active: true,
};
type Cat = { id: number; name: string; limit_gbp: string | null; is_active: boolean };

function reply(status: number, body?: unknown) {
  return new Response(JSON.stringify(body), { status });
}

function setup(opts: { user?: typeof me; post?: Response } = {}) {
  let cats: Cat[] = [
    { id: 1, name: "Travel", limit_gbp: "150.00", is_active: true },
    { id: 2, name: "Old", limit_gbp: null, is_active: false },
  ];
  const calls: Array<{ url: string; method: string; body: unknown }> = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      if (url.includes("/api/auth/me")) return Promise.resolve(reply(200, opts.user ?? me));
      calls.push({ url, method, body });
      if (method === "POST")
        return Promise.resolve(
          opts.post ?? reply(201, { id: 3, name: "x", limit_gbp: null, is_active: true }),
        );
      if (method === "PATCH") {
        const id = Number(url.split("/").pop());
        cats = cats.map((c) => (c.id === id ? { ...c, ...body } : c));
        return Promise.resolve(
          reply(
            200,
            cats.find((c) => c.id === id),
          ),
        );
      }
      return Promise.resolve(reply(200, cats));
    }),
  );
  render(
    <MemoryRouter initialEntries={["/admin/categories"]}>
      <App />
    </MemoryRouter>,
  );
  return calls;
}

describe("Categories admin", () => {
  beforeEach(() => {
    localStorage.clear();
    setSessionToken("t");
  });
  afterEach(() => vi.unstubAllGlobals());

  it("[AC-072] lists categories with limit and status, and the nav link", async () => {
    const calls = setup();
    expect(await screen.findByTestId("row-1")).toBeInTheDocument();
    expect(calls[0].url).toContain("/api/categories?include_retired=true");
    expect(screen.getByTestId("limit-text-1")).toHaveTextContent("£150.00");
    expect(screen.getByTestId("limit-text-2")).toHaveTextContent("No limit");
    expect(screen.getByText("Retired")).toBeInTheDocument();
    expect(screen.getByText("Categories", { selector: "a" })).toBeInTheDocument();
  });

  it("[AC-075] non-Finance is redirected and sees no nav link", async () => {
    setup({ user: { ...me, role: "Employee" } });
    expect((await screen.findAllByText("My claims")).length).toBeGreaterThan(0);
    expect(screen.queryByText("Categories", { selector: "a" })).toBeNull();
  });

  it("[AC-072] add posts the new category", async () => {
    const calls = setup();
    await screen.findByTestId("row-1");
    await userEvent.type(screen.getByTestId("new-name"), "Meals");
    await userEvent.type(screen.getByTestId("new-limit"), "20");
    await userEvent.click(screen.getByTestId("create-submit"));
    await waitFor(() => expect(calls.some((c) => c.method === "POST")).toBe(true));
    expect(calls.find((c) => c.method === "POST")?.body).toEqual({
      name: "Meals",
      limit_gbp: "20",
    });
  });

  it("[AC-076] 409 shows the duplicate message and keeps the text", async () => {
    setup({ post: reply(409, { detail: "A category with that name already exists" }) });
    await screen.findByTestId("row-1");
    await userEvent.type(screen.getByTestId("new-name"), "Travel");
    await userEvent.click(screen.getByTestId("create-submit"));
    expect(await screen.findByTestId("name-error")).toHaveTextContent(
      "A category with that name already exists",
    );
    expect(screen.getByTestId("new-name")).toHaveValue("Travel");
  });

  it("[AC-073] sets a limit, rejects invalid input, and clears it", async () => {
    const calls = setup();
    await screen.findByTestId("row-1");
    const input = screen.getByTestId("limit-1");
    await userEvent.clear(input);
    await userEvent.type(input, "1.234");
    await userEvent.click(screen.getByTestId("save-limit-1"));
    expect(await screen.findByTestId("limit-error-1")).toBeInTheDocument();
    await userEvent.clear(input);
    await userEvent.type(input, "99.5");
    await userEvent.click(screen.getByTestId("save-limit-1"));
    await waitFor(() => expect(screen.getByTestId("limit-text-1")).toHaveTextContent("£99.50"));
    await userEvent.click(screen.getByTestId("clear-limit-1"));
    await waitFor(() => expect(screen.getByTestId("limit-text-1")).toHaveTextContent("No limit"));
    expect(calls.filter((c) => c.method === "PATCH").pop()?.body).toEqual({ limit_gbp: null });
  });

  it("[AC-074] retires and reactivates a category", async () => {
    setup();
    await screen.findByTestId("row-1");
    await userEvent.click(screen.getByTestId("toggle-1"));
    await waitFor(() => expect(screen.getAllByText("Retired")).toHaveLength(2));
    await userEvent.click(screen.getByTestId("toggle-2"));
    await waitFor(() => expect(screen.getAllByText("Retired")).toHaveLength(1));
  });
});
