import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api";
import Claim from "./Claim";

// A plain function, not a spy: spies attach a handler to returned promises, which makes a
// rejected mock look unhandled.
let impl: (url: string, init?: RequestInit) => Promise<unknown> = async () => undefined;
const calls: Array<[string, RequestInit | undefined]> = [];
vi.mock("@/lib/api", async (orig) => ({
  ...(await orig<typeof import("@/lib/api")>()),
  apiFetch: (url: string, init?: RequestInit) => {
    calls.push([url, init]);
    return impl(url, init);
  },
}));

const cats = [
  { id: 1, name: "Travel", limit_gbp: null, is_active: true },
  { id: 2, name: "Old", limit_gbp: null, is_active: false },
];
const line = {
  id: 9,
  date: "2026-11-03",
  category_id: 1,
  category_name: "Travel",
  category_is_active: true,
  amount_gbp: "12.50",
  description: "Train",
};
const claim = (over = {}) => ({
  id: 5,
  reference: "EXP-0005",
  title: null,
  status: "draft",
  owner_id: 1,
  owner_name: "Ann Owner",
  created_at: "2026-11-03T10:00:00Z",
  lines: [],
  total_gbp: "0.00",
  ...over,
});

function mount(path: string, handler: (url: string, init?: RequestInit) => unknown) {
  impl = async (url, init) => {
    if (url === "/api/categories") return cats;
    return handler(url, init);
  };
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/claim" element={<Claim />} />
        <Route path="/claims/:id" element={<Claim />} />
        <Route path="/dashboard" element={<p>Dashboard page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function fill() {
  await userEvent.type(screen.getByLabelText("Date"), "2026-11-03");
  await userEvent.selectOptions(screen.getByLabelText("Category"), "1");
  await userEvent.type(screen.getByLabelText("Amount (GBP)"), "12.50");
  await userEvent.type(screen.getByLabelText("Description"), "Train");
}

describe("Claim screen", () => {
  beforeEach(() => {
    calls.length = 0;
  });
  afterEach(() => vi.unstubAllGlobals());

  it("[AC-029] shows field errors for an empty and a bad amount, and makes no save call", async () => {
    mount("/claim", () => claim());
    await screen.findByTestId("add-line");
    await userEvent.type(screen.getByLabelText("Amount (GBP)"), "1.234");
    await userEvent.click(screen.getByTestId("add-line"));
    expect(await screen.findByText(/pick the date/i)).toBeInTheDocument();
    expect(screen.getByText(/choose a category/i)).toBeInTheDocument();
    expect(screen.getByText(/at most two decimals/i)).toBeInTheDocument();
    expect(screen.getByText(/short description/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Amount (GBP)")).toHaveAttribute("aria-invalid", "true");
    expect(calls.filter(([u]) => u !== "/api/categories")).toHaveLength(0);
  });

  it("[AC-028] [AC-030] creates the claim, adds a line and shows the server total", async () => {
    mount("/claim", (url) => {
      if (url === "/api/claims") return claim();
      if (url === "/api/claims/5/lines") return claim({ lines: [line], total_gbp: "12.50" });
      return claim({ lines: [line], total_gbp: "12.50" });
    });
    await screen.findByTestId("add-line");
    await fill();
    await userEvent.click(screen.getByTestId("add-line"));
    expect(await screen.findByText("Train", { selector: "td" })).toBeInTheDocument();
    expect(await screen.findByTestId("total")).toHaveTextContent("£12.50");
    expect(screen.getByText("Claim EXP-0005 — Draft", { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/Ann Owner/)).toBeInTheDocument();
    const paths = calls.map(([u]) => u);
    expect(paths).toContain("/api/claims");
    expect(paths).toContain("/api/claims/5/lines");
  });

  it("[AC-031] offers only active categories and shows retired category names", async () => {
    mount("/claims/5", () =>
      claim({ lines: [{ ...line, category_name: "Retired cat", category_is_active: false }] }),
    );
    expect(await screen.findByText("Retired cat")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Travel" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Old" })).toBeNull();
  });

  it("[AC-036] confirming delete calls DELETE then goes to the dashboard", async () => {
    mount("/claims/5", (_u, init) => (init?.method === "DELETE" ? undefined : claim()));
    await userEvent.click(await screen.findByRole("button", { name: "Delete draft" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(await screen.findByText("Dashboard page")).toBeInTheDocument();
    expect(calls).toContainEqual(["/api/claims/5", { method: "DELETE" }]);
  });

  it("[AC-038] cancelling the dialog makes no delete call", async () => {
    mount("/claims/5", () => claim());
    await userEvent.click(await screen.findByRole("button", { name: "Delete draft" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Delete draft" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(calls.some(([, i]) => i?.method === "DELETE")).toBe(false);
  });

  it("[AC-037] a 409 on delete shows the message and keeps the claim", async () => {
    mount("/claims/5", (_u, init) => {
      if (init?.method === "DELETE") throw new ApiError(409, "Only draft claims can be deleted");
      return claim();
    });
    await userEvent.click(await screen.findByRole("button", { name: "Delete draft" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(await screen.findByText("Only draft claims can be deleted")).toBeInTheDocument();
    expect(screen.getByText(/EXP-0005/)).toBeInTheDocument();
  });

  it("[AC-037] a non-draft claim is locked with no Delete button", async () => {
    mount("/claims/5", () => claim({ status: "submitted" }));
    await screen.findByText(/EXP-0005/);
    expect(screen.queryByRole("button", { name: "Delete draft" })).toBeNull();
    expect(screen.queryByTestId("add-line")).toBeNull();
  });

  it("[AC-028] shows Claim not found on 404", async () => {
    mount("/claims/77", () => {
      throw new ApiError(404, "Not found");
    });
    expect(await screen.findByText("Claim not found")).toBeInTheDocument();
  });
});
