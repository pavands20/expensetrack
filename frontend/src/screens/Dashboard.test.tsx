import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Dashboard from "./Dashboard";

let impl: (url: string, init?: RequestInit) => Promise<unknown> = async () => undefined;
const calls: Array<[string, RequestInit | undefined]> = [];
vi.mock("@/lib/api", async (orig) => ({
  ...(await orig<typeof import("@/lib/api")>()),
  apiFetch: (url: string, init?: RequestInit) => {
    calls.push([url, init]);
    return impl(url, init);
  },
}));

const claim = (id: number, status: string, over = {}) => ({
  id,
  reference: "EXP-000" + id,
  title: null,
  status,
  owner_id: 1,
  owner_name: "Ann",
  created_at: "2026-11-03T10:00:00Z",
  lines: [],
  total_gbp: "10.00",
  last_rejection: null,
  ...over,
});
const dash = (claims: Record<string, unknown[]> = {}) => {
  const keys = ["draft", "submitted", "manager_approved", "approved", "paid"];
  const full: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};
  for (const k of keys) {
    full[k] = claims[k] ?? [];
    counts[k] = full[k].length;
  }
  return { counts, claims: full };
};

function mount() {
  render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/claims/:id" element={<p>Claim page</p>} />
        <Route path="/claim" element={<p>New claim page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Dashboard", () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it("[AC-080] [AC-082] tabs show counts and the API's claims only", async () => {
    impl = async () =>
      dash({ draft: [claim(1, "draft")], paid: [claim(2, "paid"), claim(3, "paid")] });
    mount();
    expect(await screen.findByRole("tab", { name: /Draft/ })).toHaveTextContent("1");
    expect(screen.getByRole("tab", { name: /Paid/ })).toHaveTextContent("2");
    expect(screen.getAllByText("EXP-0001").length).toBeGreaterThan(0);
    expect(screen.queryByText("EXP-0002")).toBeNull();
    expect(screen.queryByText(/CLM-/)).toBeNull();
    await userEvent.click(screen.getByRole("tab", { name: /Paid/ }));
    expect(screen.getAllByText("EXP-0002").length).toBeGreaterThan(0);
    expect(calls[0][0]).toBe("/api/dashboard/me");
  });

  it("[AC-081] a returned claim shows who returned it and opens the claim", async () => {
    impl = async () =>
      dash({
        draft: [
          claim(4, "draft", {
            last_rejection: {
              comment: "Fix the receipt",
              decided_by_name: "Priya",
              decided_at: "2026-11-04T10:00:00Z",
            },
          }),
        ],
      });
    mount();
    expect(await screen.findByText("Returned by Priya:")).toBeInTheDocument();
    expect(screen.getByText("Fix the receipt")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("link", { name: "EXP-0004" }));
    expect(await screen.findByText("Claim page")).toBeInTheDocument();
  });

  it("[AC-083] with no claims it shows the empty state and a New claim button", async () => {
    impl = async () => dash();
    mount();
    expect(await screen.findByText(/No claims yet/)).toBeInTheDocument();
    const links = screen.getAllByRole("link", { name: "New claim" });
    await userEvent.click(links[links.length - 1]);
    expect(await screen.findByText("New claim page")).toBeInTheDocument();
  });

  it("[AC-080] deleting a draft calls DELETE and refetches", async () => {
    let deleted = false;
    impl = async (_u, init) => {
      if (init?.method === "DELETE") {
        deleted = true;
        return undefined;
      }
      return dash({ draft: deleted ? [] : [claim(5, "draft")] });
    };
    mount();
    await userEvent.click(await screen.findByLabelText(/Select draft EXP-0005/));
    await userEvent.click(screen.getByRole("button", { name: "Delete draft" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete draft" }));
    expect(await screen.findByText(/No claims yet/)).toBeInTheDocument();
    expect(calls).toContainEqual(["/api/claims/5", { method: "DELETE" }]);
  });
});
