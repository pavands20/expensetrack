import React from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";

import { apiFetch, ApiError } from "@/lib/api";
import { useCurrentUser } from "@/lib/auth";
import { Empty, Table, TBody, TD, TH, THead, TR } from "@/lib/ui";

type Row = { month: string; category_id: number; category: string; total_gbp: string };

const gbp = (v: string) => `£${Number(v).toFixed(2)}`;

function TotalsReport() {
  const me = useCurrentUser();
  const isFinance = me?.role === "Finance";
  const q = useQuery({
    queryKey: ["reports-totals"],
    queryFn: () => apiFetch<Row[]>("/api/reports/totals"),
    enabled: isFinance,
    retry: false,
  });
  if (!isFinance || (q.error instanceof ApiError && q.error.status === 403))
    return (
      <p role="alert" data-testid="access-denied" className="p-6">
        Access denied
      </p>
    );
  return (
    <div className="mx-auto grid max-w-5xl gap-6 p-6">
      <h1 className="text-2xl font-bold">Totals</h1>
      <p>Totals cover approved and paid claims only, in GBP.</p>
      {q.isLoading && <p role="status">Loading…</p>}
      {q.isError && <p role="alert">Could not load the totals.</p>}
      {q.data && q.data.length === 0 && <Empty title="No approved or paid claims yet" />}
      {q.data && q.data.length > 0 && (
        <Table>
          <THead>
            <TR>
              <TH>Month</TH>
              <TH>Category</TH>
              <TH>Total (GBP)</TH>
            </TR>
          </THead>
          <TBody>
            {q.data.map((r) => (
              <TR
                key={`${r.month}-${r.category_id}`}
                data-testid={`total-${r.month}-${r.category_id}`}
              >
                <TD>{r.month}</TD>
                <TD>{r.category}</TD>
                <TD>{gbp(r.total_gbp)}</TD>
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
      <TotalsReport />
    </QueryClientProvider>
  );
}
