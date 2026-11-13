import React from "react";
import { Link } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";

import { apiFetch, ApiError } from "@/lib/api";
import { Empty, Table, TBody, TD, TH, THead, TR } from "@/lib/ui";

type Row = {
  id: number;
  reference: string;
  owner_name: string;
  total_gbp: string;
  status: string;
  lines?: { over_limit?: boolean }[];
};

const label = (s: string) => s.replace(/_/g, " ");

function Queue() {
  const q = useQuery({
    queryKey: ["approvals-queue"],
    queryFn: () => apiFetch<Row[]>("/api/approvals/queue"),
    retry: false,
  });
  if (q.error instanceof ApiError && q.error.status === 403)
    return (
      <p role="alert" className="p-6">
        Only managers and Finance can see approvals.
      </p>
    );
  return (
    <div className="mx-auto grid max-w-5xl gap-6 p-6">
      <h1 className="text-2xl font-bold">Approvals</h1>
      {q.isLoading && <p role="status">Loading…</p>}
      {q.isError && <p role="alert">Could not load the approvals queue.</p>}
      {q.data && q.data.length === 0 && (
        <Empty title="Nothing waiting for you" description="No claims await your decision." />
      )}
      {q.data && q.data.length > 0 && (
        <Table>
          <THead>
            <TR>
              <TH>Reference</TH>
              <TH>Submitter</TH>
              <TH>Total</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {q.data.map((r) => (
              <TR key={r.id} data-testid={`queue-${r.id}`}>
                <TD>
                  <Link to={`/claims/${r.id}`}>{r.reference}</Link>
                  {r.lines?.some((l) => l.over_limit) && (
                    <strong data-testid={`queue-over-limit-${r.id}`} style={{ marginLeft: 8 }}>
                      Over limit
                    </strong>
                  )}
                </TD>
                <TD>{r.owner_name}</TD>
                <TD>£{r.total_gbp}</TD>
                <TD>{label(r.status)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}

export default function Screen() {
  const [client] = React.useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <Queue />
    </QueryClientProvider>
  );
}
