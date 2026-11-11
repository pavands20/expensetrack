import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api";
import Claim from "@/screens/Claim";

let impl: (url: string, init?: RequestInit) => Promise<unknown> = async () => undefined;
const calls: Array<[string, RequestInit | undefined]> = [];
vi.mock("@/lib/api", async (orig) => ({
  ...(await orig<typeof import("@/lib/api")>()),
  apiFetch: (url: string, init?: RequestInit) => {
    calls.push([url, init]);
    return impl(url, init);
  },
}));

const line = (id: number) => ({
  id,
  date: "2026-11-03",
  category_id: 1,
  category_name: "Travel",
  category_is_active: true,
  amount_gbp: "12.50",
  description: "Train" + id,
  has_receipt: false,
});
const claim = (over = {}) => ({
  id: 5,
  reference: "EXP-0005",
  title: null,
  status: "draft",
  owner_id: 1,
  owner_name: "Ann Owner",
  created_at: "2026-11-03T10:00:00Z",
  lines: [line(9), line(10)],
  total_gbp: "25.00",
  ...over,
});

function mount(onSubmit: () => unknown, c = claim()) {
  impl = async (url) => {
    if (url === "/api/categories") return [];
    if (url === "/api/claims/5/submit") return onSubmit();
    return c;
  };
  render(
    <MemoryRouter initialEntries={["/claims/5"]}>
      <Routes>
        <Route path="/claims/:id" element={<Claim />} />
      </Routes>
    </MemoryRouter>,
  );
}

const submitBtn = () => screen.findByRole("button", { name: "Submit claim" });

describe("SubmitClaim", () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it("[AC-048] submits and shows the new status and locked state", async () => {
    mount(() => claim({ status: "pending_manager" }));
    await userEvent.click(await submitBtn());
    expect(await screen.findByText(/Pending manager/)).toBeInTheDocument();
    const c = calls.find(([u]) => u === "/api/claims/5/submit");
    expect(c?.[1]?.method).toBe("POST");
    expect(screen.queryByTestId("add-line")).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete draft" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Submit claim" })).toBeNull();
  });

  it("[AC-049] an empty claim shows the message and submits nothing", async () => {
    mount(() => claim(), claim({ lines: [], total_gbp: "0.00" }));
    await userEvent.click(await submitBtn());
    expect(await screen.findByText("Add at least one line before submitting.")).toBeInTheDocument();
    expect(calls.some(([u]) => u.endsWith("/submit"))).toBe(false);
  });

  it("[AC-043] a 422 marks the lines missing a receipt", async () => {
    mount(() => {
      throw new ApiError(422, { message: "x", missing_receipt_line_ids: [10] } as never);
    });
    await userEvent.click(await submitBtn());
    expect(
      await screen.findByText("Every line needs a receipt before you can submit."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Receipt missing")).toHaveLength(1);
    expect(screen.getByTestId("line-10")).toHaveTextContent("Receipt missing");
  });

  it("[AC-048] a 409 shows the already submitted message", async () => {
    mount(() => {
      throw new ApiError(409, "nope");
    });
    await userEvent.click(await submitBtn());
    expect(await screen.findByText("This claim has already been submitted.")).toBeInTheDocument();
  });

  it("[AC-048] other failures show the generic message", async () => {
    mount(() => {
      throw new ApiError(500, "boom");
    });
    await userEvent.click(await submitBtn());
    expect(
      await screen.findByText("Could not submit the claim. Please try again."),
    ).toBeInTheDocument();
  });
});
