import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Approvals from "./Approvals";
import Claim from "./Claim";

let impl: (url: string, init?: RequestInit) => Promise<unknown> = async () => undefined;
vi.mock("@/lib/api", async (orig) => ({
  ...(await orig<typeof import("@/lib/api")>()),
  apiFetch: (url: string, init?: RequestInit) => impl(url, init),
}));
let me = { id: 2, name: "Mo", email: "m@x.io", role: "Manager" };
vi.mock("@/lib/auth", () => ({ useCurrentUser: () => me }));

const line = (id: number, over: boolean, limit: string | null) => ({
  id,
  date: "2026-11-03",
  category_id: 1,
  category_name: "Travel",
  category_is_active: true,
  amount_gbp: "60.00",
  description: "Taxi" + id,
  has_receipt: true,
  over_limit: over,
  category_limit_gbp: limit,
});
const claim = (lines: unknown[], status = "pending_manager") => ({
  id: 5,
  reference: "EXP-0005",
  title: null,
  status,
  owner_id: 1,
  owner_name: "Ann",
  created_at: "2026-11-03T10:00:00Z",
  lines,
  total_gbp: "60.00",
});

function mountClaim(c: unknown) {
  impl = async (url) => (url === "/api/categories" ? [] : url.endsWith("/history") ? [] : c);
  render(
    <MemoryRouter initialEntries={["/claims/5"]}>
      <Routes>
        <Route path="/claims/:id" element={<Claim />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("over-limit flag", () => {
  beforeEach(() => {
    me = { id: 2, name: "Mo", email: "m@x.io", role: "Manager" };
  });

  it("[AC-077] a manager sees the flag with the limit on an over-limit line", async () => {
    mountClaim(claim([line(9, true, "50.00")]));
    expect(await screen.findByTestId("over-limit-9")).toHaveTextContent("Over limit (£50.00)");
  });

  it("[AC-077] Finance sees the flag too", async () => {
    me = { ...me, id: 3, role: "Finance" };
    mountClaim(claim([line(9, true, "50.00")], "pending_finance"));
    expect(await screen.findByTestId("over-limit-9")).toBeInTheDocument();
  });

  it("[AC-077] the owner does not see the flag", async () => {
    me = { ...me, id: 1, role: "Employee" };
    mountClaim(claim([line(9, true, "50.00")]));
    await screen.findByTestId("line-9");
    expect(screen.queryByTestId("over-limit-9")).toBeNull();
  });

  it("[AC-078] a line that is not over limit shows no flag", async () => {
    mountClaim(claim([line(9, false, "60.00"), line(10, false, null)]));
    await screen.findByTestId("line-9");
    expect(screen.queryByTestId("over-limit-9")).toBeNull();
    expect(screen.queryByTestId("over-limit-10")).toBeNull();
  });

  it("[AC-077] queue rows flag claims with an over-limit line only", async () => {
    const row = (id: number, lines: unknown[]) => ({
      id,
      reference: "EXP-000" + id,
      owner_name: "Ann",
      total_gbp: "60.00",
      status: "pending_manager",
      lines,
    });
    impl = async () => [row(5, [line(1, true, "50.00")]), row(6, [line(2, false, null)])];
    render(
      <MemoryRouter>
        <Approvals />
      </MemoryRouter>,
    );
    expect(await screen.findByTestId("queue-over-limit-5")).toHaveTextContent("Over limit");
    expect(screen.queryByTestId("queue-over-limit-6")).toBeNull();
  });

  it("[AC-079] the employee's submit is not blocked by an over-limit line", async () => {
    me = { ...me, id: 1, role: "Employee" };
    const draft = claim([line(9, true, "50.00")], "draft");
    impl = async (url) =>
      url === "/api/categories"
        ? []
        : url.endsWith("/history")
          ? []
          : url.endsWith("/submit")
            ? { ...draft, status: "pending_manager" }
            : draft;
    render(
      <MemoryRouter initialEntries={["/claims/5"]}>
        <Routes>
          <Route path="/claims/:id" element={<Claim />} />
        </Routes>
      </MemoryRouter>,
    );
    await userEvent.click(await screen.findByRole("button", { name: "Submit claim" }));
    expect(await screen.findByText(/Pending manager/)).toBeInTheDocument();
  });
});
