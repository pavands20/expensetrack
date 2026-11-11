import React from "react";

import { apiFetch, ApiError } from "@/lib/api";

type SubmitClaimData = { id: number; lines: unknown[] };

type Props<T extends SubmitClaimData> = {
  claim: T | null;
  onSubmitted: (claim: T) => void;
  onMissing: (lineIds: number[]) => void;
};

export function SubmitClaim<T extends SubmitClaimData>({
  claim,
  onSubmitted,
  onMissing,
}: Props<T>) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  async function submit() {
    setError("");
    onMissing([]);
    if (!claim || claim.lines.length === 0) {
      setError("Add at least one line before submitting.");
      return;
    }
    setBusy(true);
    try {
      const saved = await apiFetch<T>(`/api/claims/${claim.id}/submit`, { method: "POST" });
      onSubmitted(saved);
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      if (status === 422) {
        const detail = (err as ApiError).detail as unknown;
        const ids = (detail as { missing_receipt_line_ids?: unknown } | null)
          ?.missing_receipt_line_ids;
        if (Array.isArray(ids) && ids.length > 0) {
          onMissing(ids as number[]);
          setError("Every line needs a receipt before you can submit.");
        } else if (Array.isArray(ids)) setError("Add at least one line before submitting.");
        else setError("Could not submit the claim. Please try again.");
      } else if (status === 409) setError("This claim has already been submitted.");
      else setError("Could not submit the claim. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className="xt-btn xt-btn-primary"
        data-testid="submit-claim"
        disabled={busy}
        onClick={submit}
      >
        Submit claim
      </button>
      {error && (
        <p role="alert" className="xt-err">
          {error}
        </p>
      )}
    </div>
  );
}
