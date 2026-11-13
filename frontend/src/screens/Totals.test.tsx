import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api";
import Totals from "./Totals";

let impl: () => Promise<unknown> = async () => [];
const calls: string[] = [];
vi.mock("@/lib/api", async (orig) => ({
  ...(await orig<typeof import("@/lib/api")>()),
  apiFetch: (url: string) => {
    calls.push(url);
    return impl();
  },
}));
let me = { id: 1, name: "Fin", email: "f@x.io", role: "Finance" };
vi.mock("@/lib/auth", () => ({ useCurrentUser: () => me }));

describe("Totals", () => {
  beforeEach(() => {
    calls.length = 0;
    me = { id: 1, name: "Fin", email: "f@x.io", role: "Finance" };
  });

  it("[AC-084] renders rows with £ formatting and the approved/paid note", async () => {
    impl = async () => [
      { month: "2026-11", category_id: 1, category: "Travel", total_gbp: "125.5" },
      { month: "2026-10", category_id: 2, category: "Meals", total_gbp: "20.00" },
    ];
    render(<Totals />);
    expect(await screen.findByText("£125.50")).toBeInTheDocument();
    expect(screen.getByText("Meals")).toBeInTheDocument();
    expect(screen.getByText(/approved and paid claims only/)).toBeInTheDocument();
    expect(calls).toEqual(["/api/reports/totals"]);
  });

  it("[AC-084] shows the empty state", async () => {
    impl = async () => [];
    render(<Totals />);
    expect(await screen.findByText("No approved or paid claims yet")).toBeInTheDocument();
  });

  it("[AC-084] shows an error state", async () => {
    impl = async () => {
      throw new ApiError(500, "boom");
    };
    render(<Totals />);
    expect(await screen.findByText("Could not load the totals.")).toBeInTheDocument();
  });

  it.each(["Employee", "Manager"])("[AC-086] %s sees access denied and no fetch", async (role) => {
    me = { ...me, role };
    render(<Totals />);
    expect(await screen.findByTestId("access-denied")).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it("[AC-086] a 403 from the API shows access denied", async () => {
    impl = async () => {
      throw new ApiError(403, "Forbidden");
    };
    render(<Totals />);
    expect(await screen.findByTestId("access-denied")).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });
});
