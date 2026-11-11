import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api";
import { ReceiptControl } from "./ReceiptControl";

let impl: (url: string, init?: RequestInit) => Promise<unknown> = async () => undefined;
const calls: Array<[string, RequestInit | undefined]> = [];
vi.mock("@/lib/api", async (orig) => ({
  ...(await orig<typeof import("@/lib/api")>()),
  apiFetch: (url: string, init?: RequestInit) => {
    calls.push([url, init]);
    return impl(url, init);
  },
}));

const user = userEvent.setup({ applyAccept: false });
const pdf = () => new File(["x"], "r.pdf", { type: "application/pdf" });
const MSG = "Receipts must be JPEG, PNG or PDF files of 5 MB or less.";

function mount(over: Partial<React.ComponentProps<typeof ReceiptControl>> = {}) {
  render(<ReceiptControl claimId={5} lineId={9} hasReceipt={false} locked={false} {...over} />);
}

describe("ReceiptControl", () => {
  beforeEach(() => {
    calls.length = 0;
    impl = async () => ({ id: 5 });
  });
  afterEach(() => vi.restoreAllMocks());

  it("[AC-039] attaches a receipt via multipart PUT and shows Receipt attached", async () => {
    mount();
    expect(screen.getByText(/No receipt/)).toBeInTheDocument();
    const input = screen.getByLabelText("Attach receipt");
    expect(input).toHaveAttribute("accept", "image/jpeg,image/png,application/pdf");
    await user.upload(input, pdf());
    expect(await screen.findByText(/Receipt attached/)).toBeInTheDocument();
    expect(calls[0][0]).toBe("/api/claims/5/lines/9/receipt");
    expect(calls[0][1]?.method).toBe("PUT");
    expect((calls[0][1]?.body as FormData).get("file")).toBeInstanceOf(File);
  });

  it("[AC-040] rejects a bad type client-side", async () => {
    mount();
    await user.upload(
      screen.getByLabelText("Attach receipt"),
      new File(["x"], "a.gif", { type: "image/gif" }),
    );
    expect(await screen.findByText(MSG)).toBeInTheDocument();
    expect(calls).toHaveLength(0);
    expect(screen.getByText(/No receipt/)).toBeInTheDocument();
  });

  it("[AC-040] rejects an oversize file client-side", async () => {
    mount();
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "b.pdf", {
      type: "application/pdf",
    });
    await user.upload(screen.getByLabelText("Attach receipt"), big);
    expect(await screen.findByText(MSG)).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it("[AC-040] shows the message for a 413 response", async () => {
    impl = async () => {
      throw new ApiError(413, MSG);
    };
    mount();
    await user.upload(screen.getByLabelText("Attach receipt"), pdf());
    expect(await screen.findByText(MSG)).toBeInTheDocument();
    expect(screen.getByText(/No receipt/)).toBeInTheDocument();
  });

  it("[AC-041] replaces an existing receipt", async () => {
    mount({ hasReceipt: true });
    expect(screen.queryByLabelText("Attach receipt")).toBeNull();
    await user.upload(screen.getByLabelText("Replace receipt"), pdf());
    expect(await screen.findByText(/Receipt attached/)).toBeInTheDocument();
    expect(calls[0][1]?.method).toBe("PUT");
    expect(screen.getAllByText(/Receipt attached/)).toHaveLength(1);
  });

  it("[AC-042] a 409 shows the locked message", async () => {
    impl = async () => {
      throw new ApiError(409, "nope");
    };
    mount();
    await user.upload(screen.getByLabelText("Attach receipt"), pdf());
    expect(
      await screen.findByText("Receipts can't be changed once a claim is submitted"),
    ).toBeInTheDocument();
  });

  it("[AC-042] locked claims render no upload or replace controls but can view", async () => {
    mount({ locked: true, hasReceipt: true });
    expect(screen.queryByLabelText("Attach receipt")).toBeNull();
    expect(screen.queryByLabelText("Replace receipt")).toBeNull();
    expect(screen.getByRole("button", { name: "View receipt" })).toBeInTheDocument();
  });

  it("[AC-039] View receipt opens the short-lived url in a new tab with noopener", async () => {
    impl = async () => ({ url: "https://s3.example/r?sig=1", expires_in: 300 });
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    mount({ hasReceipt: true, locked: true });
    await user.click(screen.getByRole("button", { name: "View receipt" }));
    await vi.waitFor(() => expect(open).toHaveBeenCalled());
    expect(calls[0][0]).toBe("/api/claims/5/lines/9/receipt-url");
    expect(open.mock.calls[0][0]).toBe("https://s3.example/r?sig=1");
    expect(open.mock.calls[0][1]).toBe("_blank");
    expect(String(open.mock.calls[0][2])).toContain("noopener");
  });

  it("[AC-039] a highlighted line is marked as missing a receipt", () => {
    mount({ highlighted: true });
    expect(screen.getByText(/missing a receipt/)).toBeInTheDocument();
  });
});
