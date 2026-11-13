import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api";
import Approvals from "@/screens/Approvals";
import Claim from "@/screens/Claim";
import { ApprovalPanel } from "./ApprovalPanel";
import { ClaimHistory } from "./ClaimHistory";

let impl: (url: string, init?: RequestInit) => Promise<unknown> = async () => undefined;
const calls: Array<[string, RequestInit | undefined]> = [];
vi.mock("@/lib/api", async (orig) => ({
  ...(await orig<typeof import("@/lib/api")>()),
  apiFetch: (url: string, init?: RequestInit) => {
    calls.push([url, init]);
    return impl(url, init);
  },
}));
let me = { id: 2, name: "Mo", email: "m@x.io", role: "Manager" };
vi.mock("@/lib/auth", () => ({ useCurrentUser: () => me }));

const pending = { id: 5, status: "pending_manager", owner_id: 1 };

describe("approvals UI", () => {
  beforeEach(() => {
    calls.length = 0;
    me = { id: 2, name: "Mo", email: "m@x.io", role: "Manager" };
  });

  it("[AC-052] approve posts the decision and passes the claim on", async () => {
    const saved = { ...pending, status: "pending_finance" };
    impl = async () => saved;
    const done = vi.fn();
    render(<ApprovalPanel claim={pending} onDecided={done} />);
    await userEvent.click(screen.getByRole("button", { name: "Approve" }));
    await vi.waitFor(() => expect(done).toHaveBeenCalledWith(saved));
    expect(calls[0][0]).toBe("/api/claims/5/decision");
    expect(JSON.parse(String(calls[0][1]?.body))).toEqual({ decision: "approve", comment: null });
  });

  it("[AC-054] reject with a blank comment is blocked client-side", async () => {
    render(<ApprovalPanel claim={pending} onDecided={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/Comment/), "   ");
    await userEvent.click(screen.getByRole("button", { name: "Reject" }));
    expect(await screen.findByText(/add a comment/i)).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it("[AC-054] a 422 shows the comment message", async () => {
    impl = async () => {
      throw new ApiError(422, "x");
    };
    render(<ApprovalPanel claim={pending} onDecided={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/Comment/), "no");
    await userEvent.click(screen.getByRole("button", { name: "Reject" }));
    expect(await screen.findByText(/add a comment/i)).toBeInTheDocument();
  });

  it("[AC-059] a 409 shows a refusal and does not change the claim", async () => {
    impl = async () => {
      throw new ApiError(409, "x");
    };
    const done = vi.fn();
    render(<ApprovalPanel claim={pending} onDecided={done} />);
    await userEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(await screen.findByText(/can't decide this claim/i)).toBeInTheDocument();
    expect(done).not.toHaveBeenCalled();
  });

  it("[AC-055] the panel is not rendered for the submitter", () => {
    me = { ...me, id: 1 };
    render(<ApprovalPanel claim={pending} onDecided={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
  });

  it("[AC-096] history lists entries in order with no edit controls", async () => {
    impl = async () => [
      {
        id: 1,
        old_status: "draft",
        new_status: "pending_manager",
        actor_name: "Ann",
        comment: null,
        created_at: "2026-11-03T10:00:00Z",
      },
      {
        id: 2,
        old_status: "pending_manager",
        new_status: "draft",
        actor_name: "Mo",
        comment: "Fix it",
        created_at: "2026-11-04T10:00:00Z",
      },
    ];
    render(<ClaimHistory claimId={5} version="x" />);
    const items = await screen.findAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Ann");
    expect(items[1]).toHaveTextContent("pending manager → draft");
    expect(items[1]).toHaveTextContent("Fix it");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("[AC-053] [AC-056] a returned draft shows the rejection banner and over-limit flag", async () => {
    impl = async (url) => {
      if (url === "/api/categories") return [];
      if (url.endsWith("/history")) return [];
      return {
        id: 5,
        reference: "EXP-0005",
        title: null,
        status: "draft",
        owner_id: 1,
        owner_name: "Ann",
        created_at: "2026-11-03T10:00:00Z",
        total_gbp: "99.00",
        last_rejection: {
          comment: "Too much",
          decided_by_name: "Mo",
          decided_at: "2026-11-04T10:00:00Z",
        },
        lines: [
          {
            id: 9,
            date: "2026-11-03",
            category_id: 1,
            category_name: "Travel",
            category_is_active: true,
            amount_gbp: "99.00",
            description: "Taxi",
            has_receipt: true,
            over_limit: true,
          },
        ],
      };
    };
    render(
      <MemoryRouter initialEntries={["/claims/5"]}>
        <Routes>
          <Route path="/claims/:id" element={<Claim />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByTestId("rejection")).toHaveTextContent("Too much");
    expect(screen.getByTestId("rejection")).toHaveTextContent("Mo");
    expect(screen.getByText("Over limit")).toBeInTheDocument();
    expect(screen.getByTestId("add-line")).toBeInTheDocument();
  });

  it("[AC-050] the queue lists rows linking to the claim", async () => {
    impl = async () => [
      {
        id: 5,
        reference: "EXP-0005",
        owner_name: "Ann",
        total_gbp: "12.50",
        status: "pending_manager",
      },
    ];
    render(
      <MemoryRouter>
        <Approvals />
      </MemoryRouter>,
    );
    const link = await screen.findByRole("link", { name: "EXP-0005" });
    expect(link).toHaveAttribute("href", "/claims/5");
    expect(screen.getByText("Ann")).toBeInTheDocument();
  });

  it("[AC-050] an empty queue shows the empty state", async () => {
    impl = async () => [];
    render(
      <MemoryRouter>
        <Approvals />
      </MemoryRouter>,
    );
    expect(await screen.findByText("Nothing waiting for you")).toBeInTheDocument();
  });

  it("[AC-050] a 403 shows a friendly message", async () => {
    impl = async () => {
      throw new ApiError(403, "Forbidden");
    };
    render(
      <MemoryRouter>
        <Approvals />
      </MemoryRouter>,
    );
    expect(await screen.findByText(/Only managers and Finance/)).toBeInTheDocument();
  });
});
