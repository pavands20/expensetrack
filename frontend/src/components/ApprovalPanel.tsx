import React from "react";

import { apiFetch, ApiError } from "@/lib/api";
import { useCurrentUser } from "@/lib/auth";

type Decidable = { id: number; status: string; owner_id: number };

const NEED_COMMENT = "Please add a comment explaining why you are rejecting this claim.";
const REFUSED = "You can't decide this claim. It may not be awaiting your decision.";

export function ApprovalPanel<T extends Decidable>({
  claim,
  onDecided,
}: {
  claim: T;
  onDecided: (claim: T) => void;
}) {
  const me = useCurrentUser();
  const [comment, setComment] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const canDecide =
    me !== null &&
    me.id !== claim.owner_id &&
    ((claim.status === "pending_manager" && me.role === "Manager") ||
      (claim.status === "pending_finance" && me.role === "Finance"));
  if (!canDecide) return null;

  async function decide(decision: "approve" | "reject") {
    setError("");
    const text = comment.trim();
    if (decision === "reject" && !text) {
      setError(NEED_COMMENT);
      return;
    }
    setBusy(true);
    try {
      const saved = await apiFetch<T>(`/api/claims/${claim.id}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision, comment: text || null }),
      });
      setComment("");
      onDecided(saved);
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      if (status === 422) setError(NEED_COMMENT);
      else if (status === 403 || status === 409) setError(REFUSED);
      else setError("Could not record your decision. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="xt-glass" style={{ padding: 24 }} aria-labelledby="decision-h">
      <h2 className="xt-h2" id="decision-h" style={{ marginBottom: 16 }}>
        Your decision
      </h2>
      <label className="xt-label" htmlFor="decision-comment">
        Comment (required to reject)
      </label>
      <textarea
        id="decision-comment"
        className="xt-input"
        maxLength={500}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {error && (
        <p role="alert" className="xt-err">
          {error}
        </p>
      )}
      <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
        <button
          type="button"
          className="xt-btn xt-btn-primary"
          disabled={busy}
          onClick={() => decide("approve")}
        >
          Approve
        </button>
        <button
          type="button"
          className="xt-btn xt-btn-warn"
          disabled={busy}
          onClick={() => decide("reject")}
        >
          Reject
        </button>
      </div>
    </section>
  );
}
