import React from "react";

import { apiFetch } from "@/lib/api";

type Entry = {
  id: number;
  old_status: string;
  new_status: string;
  actor_name: string;
  comment: string | null;
  created_at: string;
};

const label = (s: string) => s.replace(/_/g, " ");

// `version` changes whenever the claim changes, so the list reloads after a decision.
export function ClaimHistory({ claimId, version }: { claimId: number; version: string }) {
  const [entries, setEntries] = React.useState<Entry[] | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let live = true;
    apiFetch<Entry[]>(`/api/claims/${claimId}/history`)
      .then((h) => live && (setEntries(Array.isArray(h) ? h : []), setFailed(false)))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [claimId, version]);

  return (
    <section className="xt-glass" style={{ padding: 24 }} aria-labelledby="history-h">
      <h2 className="xt-h2" id="history-h" style={{ marginBottom: 16 }}>
        History
      </h2>
      {failed && <p role="alert">Could not load the history.</p>}
      {entries && entries.length === 0 && <p>No history yet.</p>}
      {entries && entries.length > 0 && (
        <ol data-testid="history" style={{ margin: 0, paddingLeft: 20 }}>
          {entries.map((e) => (
            <li key={e.id} data-testid={`history-${e.id}`}>
              <strong>{e.actor_name}</strong>: {label(e.old_status)} → {label(e.new_status)} ·{" "}
              <time dateTime={e.created_at}>{new Date(e.created_at).toLocaleString()}</time>
              {e.comment && <p style={{ margin: "4px 0" }}>“{e.comment}”</p>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
