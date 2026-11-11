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

const cats = [{ id: 1, name: "Travel", limit_gbp: null, is_active: true }];
const line = (id: number, over = {}) => ({
  id,
  date: "2026-11-03",
  category_id: 1,
  category_name: "Travel",
  category_is_active: true,
  amount_gbp: "12.50",
  description: "Train" + id,
  has_receipt: true,
  ...over,
});
const claim = (lines: unknown[], total: string, status = "draft") => ({
  id: 5,
  reference: "EXP-0005",
  title: null,
  status,
  owner_id: 1,
  owner_name: "Ann Owner",
  created_at: "2026-11-03T10:00:00Z",
  lines,
  total_gbp: total,
});

function mount(initial: unknown, onWrite?: (init: RequestInit) => unknown, categories = cats) {
  impl = async (url, init) => {
    if (url === "/api/categories") return categories;
    if (init?.method === "PATCH" || init?.method === "DELETE") return onWrite?.(init);
    return initial;
  };
  render(
    <MemoryRouter initialEntries={["/claims/5"]}>
      <Routes>
        <Route path="/claims/:id" element={<Claim />} />
      </Routes>
    </MemoryRouter>,
  );
}
const two = () => claim([line(9), line(10)], "25.00");
const edit = async () =>
  userEvent.click((await screen.findAllByRole("button", { name: "Edit" }))[0]);

describe("LineEditor", () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it("[AC-032] edit saves via PATCH and shows stored values and total", async () => {
    mount(two(), () =>
      claim([line(9, { amount_gbp: "20.00", description: "Taxi" }), line(10)], "32.50"),
    );
    await edit();
    const amt = screen.getByLabelText("Edit amount");
    await userEvent.clear(amt);
    await userEvent.type(amt, "20.00");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Taxi", { selector: "td" })).toBeInTheDocument();
    expect(screen.getByTestId("total")).toHaveTextContent("£32.50");
    const c = calls.find(([, i]) => i?.method === "PATCH");
    expect(c?.[0]).toBe("/api/claims/5/lines/9");
    expect(JSON.parse(String(c?.[1]?.body)).amount_gbp).toBe("20.00");
  });

  it("[AC-032] validation errors show next to the field and no PATCH is sent", async () => {
    mount(two());
    await edit();
    await userEvent.clear(screen.getByLabelText("Edit amount"));
    await userEvent.type(screen.getByLabelText("Edit amount"), "1.234");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText(/at most two decimals/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Edit amount")).toHaveAttribute("aria-invalid", "true");
    expect(calls.some(([, i]) => i?.method === "PATCH")).toBe(false);
  });

  it("[AC-032] a 422 maps onto the field", async () => {
    mount(two(), () => {
      throw new ApiError(422, [{ loc: ["body", "description"], msg: "too long" }] as never);
    });
    await edit();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("too long")).toBeInTheDocument();
  });

  it("[AC-032] a retired current category stays selectable", async () => {
    mount(
      claim(
        [line(9, { category_id: 2, category_name: "Old", category_is_active: false }), line(10)],
        "25.00",
      ),
    );
    await edit();
    expect(screen.getByRole("option", { name: "Old" })).toBeInTheDocument();
  });

  it("[AC-033] remove with confirm deletes the line and updates the total", async () => {
    mount(two(), () => claim([line(10)], "12.50"));
    await userEvent.click((await screen.findAllByRole("button", { name: "Remove" }))[0]);
    await userEvent.click(screen.getByRole("button", { name: "Confirm remove" }));
    expect(await screen.findByTestId("total")).toHaveTextContent("£12.50");
    expect(screen.queryByTestId("line-9")).toBeNull();
    expect(calls.some(([u, i]) => u === "/api/claims/5/lines/9" && i?.method === "DELETE")).toBe(
      true,
    );
  });

  it("[AC-033] the only line cannot be removed and shows the hint", async () => {
    mount(claim([line(9)], "12.50"));
    expect(await screen.findByRole("button", { name: "Remove" })).toBeDisabled();
    expect(
      screen.getByText("A claim needs at least one line. Delete the draft instead."),
    ).toBeInTheDocument();
  });

  it("[AC-034] a 409 shows the locked message", async () => {
    mount(two(), () => {
      throw new ApiError(409, "x");
    });
    await edit();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Only draft claims can be changed.")).toBeInTheDocument();
  });

  it("[AC-035] a 403 shows the own-claims message", async () => {
    mount(two(), () => {
      throw new ApiError(403, "x");
    });
    await userEvent.click((await screen.findAllByRole("button", { name: "Remove" }))[0]);
    await userEvent.click(screen.getByRole("button", { name: "Confirm remove" }));
    expect(await screen.findByText("You can only change your own claims.")).toBeInTheDocument();
  });

  it("[AC-034] a non-draft claim renders no edit or remove controls", async () => {
    mount(claim([line(9), line(10)], "25.00", "submitted"));
    await screen.findByText(/EXP-0005/);
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
  });
});
