import React from "react";

import { apiFetch, ApiError } from "@/lib/api";

const BAD_FILE = "Receipts must be JPEG, PNG or PDF files of 5 MB or less.";
const LOCKED = "Receipts can't be changed once a claim is submitted";
const TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_BYTES = 5 * 1024 * 1024;

type Props = {
  claimId: number;
  lineId: number;
  hasReceipt: boolean;
  locked: boolean;
  highlighted?: boolean;
  onUpdated?: (claim: never) => void;
};

export function ReceiptControl({
  claimId,
  lineId,
  hasReceipt,
  locked,
  highlighted = false,
  onUpdated,
}: Props) {
  const [attached, setAttached] = React.useState(hasReceipt);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const has = attached || hasReceipt;
  const base = `/api/claims/${claimId}/lines/${lineId}/receipt`;

  async function onFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const input = ev.target;
    const file = input.files?.[0];
    if (!file) return;
    setError("");
    if (!TYPES.includes(file.type) || file.size > MAX_BYTES) {
      setError(BAD_FILE);
      input.value = "";
      return;
    }
    const body = new FormData();
    body.append("file", file);
    setBusy(true);
    try {
      const claim = await apiFetch<never>(base, { method: "PUT", body });
      setAttached(true);
      onUpdated?.(claim);
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      setError(
        status === 413 || status === 415
          ? BAD_FILE
          : status === 409
            ? LOCKED
            : "Could not upload the receipt. Please try again.",
      );
    } finally {
      setBusy(false);
      input.value = "";
    }
  }

  async function onView() {
    setError("");
    try {
      const res = await apiFetch<{ url: string }>(`${base}-url`);
      window.open(res.url, "_blank", "noopener,noreferrer");
    } catch {
      setError("Could not open the receipt. Please try again.");
    }
  }

  const label = has ? "Replace receipt" : "Attach receipt";
  return (
    <div data-testid={`receipt-${lineId}`} style={{ display: "grid", gap: 6 }}>
      {has ? (
        <span>
          Receipt attached{" "}
          <button type="button" onClick={onView}>
            View receipt
          </button>
        </span>
      ) : (
        <span style={highlighted ? { fontWeight: 700 } : undefined}>
          No receipt
          {highlighted && <span role="alert"> — this line is missing a receipt</span>}
        </span>
      )}
      {!locked && (
        <input
          type="file"
          aria-label={label}
          accept={TYPES.join(",")}
          disabled={busy}
          onChange={onFile}
        />
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
