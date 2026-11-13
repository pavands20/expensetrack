import React from "react";
import { Link } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";
import { Table, THead, TBody, TR, TH, TD } from "@/lib/ui";

type Key = "draft" | "submitted" | "manager_approved" | "approved" | "paid";
type Claim = {
  id: number;
  reference: string;
  title: string | null;
  status: string;
  created_at: string;
  total_gbp: string;
  last_rejection?: { comment: string; decided_by_name: string; decided_at: string } | null;
};
type Dash = { counts: Record<Key, number>; claims: Record<Key, Claim[]> };

const STATUSES: { key: Key; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "submitted", label: "Submitted" },
  { key: "manager_approved", label: "Manager approved" },
  { key: "approved", label: "Approved" },
  { key: "paid", label: "Paid" },
];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
};
const gbp = (v: string) => "£" + v;

const glass = {
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.14)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  borderRadius: brand.radius,
};
const gradient = `linear-gradient(120deg, ${brand.primaryColor}, ${brand.accentColor})`;
const primaryBtn = {
  minHeight: 48,
  borderRadius: brand.radius,
  background: gradient,
  color: brand.backgroundColor,
  border: "none",
  cursor: "pointer",
};
const th = {
  color: brand.neutralColor,
  fontSize: 12,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  fontWeight: 600,
  padding: 16,
  borderBottom: "1px solid rgba(255,255,255,0.14)",
  textAlign: "left" as const,
};
const td = {
  padding: 16,
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  verticalAlign: "top" as const,
  color: "white",
};

function DashboardView() {
  const [active, setActive] = React.useState<Key>("draft");
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [confirming, setConfirming] = React.useState(false);
  const [notice, setNotice] = React.useState("");
  const [error, setError] = React.useState("");
  const q = useQuery({
    queryKey: ["dashboard-me"],
    queryFn: () => apiFetch<Dash>("/api/dashboard/me"),
    retry: false,
  });

  const data = q.data?.claims && q.data?.counts ? q.data : undefined;
  const rows = data?.claims[active] ?? [];
  const total = data ? STATUSES.reduce((s, x) => s + data.counts[x.key], 0) : 0;
  const hasNone = !!data && total === 0;
  const selected = rows.find((c) => c.id === selectedId);
  const activeLabel = STATUSES.find((s) => s.key === active)!.label;

  const changeTab = (key: Key) => {
    setActive(key);
    setSelectedId(null);
    setConfirming(false);
    setNotice("");
    setError("");
  };

  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    let n: number | null = null;
    if (e.key === "ArrowRight") n = (i + 1) % STATUSES.length;
    if (e.key === "ArrowLeft") n = (i - 1 + STATUSES.length) % STATUSES.length;
    if (e.key === "Home") n = 0;
    if (e.key === "End") n = STATUSES.length - 1;
    if (n === null) return;
    e.preventDefault();
    changeTab(STATUSES[n].key);
    document.getElementById("tab-" + STATUSES[n].key)?.focus();
  };

  const confirmDelete = async () => {
    if (!selected) return;
    try {
      await apiFetch<void>(`/api/claims/${selected.id}`, { method: "DELETE" });
      setNotice(`${selected.reference} was deleted, along with its lines and receipts.`);
      setSelectedId(null);
      setConfirming(false);
      await q.refetch();
    } catch {
      setError("Could not delete the claim. Please try again.");
      setConfirming(false);
    }
  };

  if (q.isLoading)
    return (
      <p role="status" className="p-6">
        Loading…
      </p>
    );
  if (q.isError || !data)
    return (
      <p role="alert" className="p-6">
        Could not load your claims.
      </p>
    );

  return (
    <div
      className="et-root min-h-full p-4 md:p-8"
      style={{
        fontFamily: brand.fontBody,
        color: "white",
        backgroundColor: brand.backgroundColor,
        backgroundImage: `radial-gradient(60rem 28rem at 85% -10%, color-mix(in srgb, ${brand.accentColor} 22%, transparent), transparent), radial-gradient(50rem 26rem at -10% 0%, color-mix(in srgb, ${brand.primaryColor} 18%, transparent), transparent)`,
      }}
    >
      <style>{`
        .et-root button:focus-visible, .et-root a:focus-visible, .et-root input:focus-visible { outline: 2px solid ${brand.accentColor}; outline-offset: 3px; }
        .et-btn:disabled { opacity: .5; cursor: not-allowed; }
        .et-row:hover { background: rgba(255,255,255,0.06); }
      `}</style>
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <header className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-12 md:col-span-8">
            <h1
              style={{
                fontSize: "clamp(2.5rem, 6vw, 4rem)",
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              My claims
            </h1>
          </div>
          <div className="col-span-6 md:col-span-2">
            <Link
              to="/claim"
              className="et-btn w-full inline-flex items-center justify-center gap-2 px-4 font-bold"
              style={primaryBtn}
            >
              <Icons.Plus className="w-4 h-4" aria-hidden="true" />
              New claim
            </Link>
          </div>
        </header>

        {notice && (
          <div role="status" className="flex items-start gap-3 px-4 py-3" style={glass}>
            {notice}
          </div>
        )}
        {error && (
          <p role="alert" className="px-4 py-3" style={glass}>
            {error}
          </p>
        )}

        <section aria-labelledby="status-heading">
          <h2 id="status-heading" className="sr-only">
            Status
          </h2>
          <div role="tablist" aria-label="Status" className="flex flex-wrap gap-2">
            {STATUSES.map((s, i) => {
              const on = s.key === active;
              return (
                <button
                  key={s.key}
                  id={"tab-" + s.key}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-controls="claims-panel"
                  tabIndex={on ? 0 : -1}
                  onClick={() => changeTab(s.key)}
                  onKeyDown={(e) => onTabKey(e, i)}
                  className="et-btn inline-flex items-center gap-2 px-4 rounded-full font-semibold"
                  style={{
                    minHeight: 44,
                    cursor: "pointer",
                    fontSize: 14,
                    color: on ? brand.backgroundColor : "white",
                    background: on ? gradient : "rgba(255,255,255,0.07)",
                    border: on ? "1px solid transparent" : "1px solid rgba(255,255,255,0.14)",
                  }}
                >
                  {s.label}
                  <span
                    className="inline-flex items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      minWidth: 24,
                      height: 24,
                      padding: "0 8px",
                      background: on ? "rgba(6,20,43,0.18)" : "rgba(255,255,255,0.12)",
                    }}
                  >
                    {data.counts[s.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {rows.length > 0 && (
          <section
            id="claims-panel"
            role="tabpanel"
            aria-labelledby={"tab-" + active}
            style={{ ...glass, overflow: "hidden" }}
          >
            <h2 className="sr-only">Claims</h2>
            <div className="overflow-x-auto">
              <Table
                style={{
                  width: "100%",
                  minWidth: 720,
                  borderCollapse: "collapse",
                  background: "transparent",
                  color: "white",
                }}
              >
                <THead>
                  <TR style={{ background: "transparent" }}>
                    {active === "draft" && (
                      <TH style={{ ...th, width: 56 }} scope="col">
                        <span className="sr-only">Select draft to delete</span>
                      </TH>
                    )}
                    <TH scope="col" style={th}>
                      Reference
                    </TH>
                    <TH scope="col" style={th}>
                      Title
                    </TH>
                    <TH scope="col" style={{ ...th, textAlign: "right" }}>
                      Total (GBP)
                    </TH>
                    <TH scope="col" style={th}>
                      Status
                    </TH>
                    <TH scope="col" style={th}>
                      Created
                    </TH>
                  </TR>
                </THead>
                <TBody key={active}>
                  {rows.map((c) => {
                    const isSel = c.id === selectedId;
                    return (
                      <TR key={c.id} className="et-row" data-testid={`claim-${c.id}`}>
                        {active === "draft" && (
                          <TD style={{ ...td, width: 56 }}>
                            <input
                              type="checkbox"
                              aria-label={`Select draft ${c.reference} for deletion`}
                              checked={isSel}
                              onChange={() => {
                                setSelectedId(isSel ? null : c.id);
                                setConfirming(false);
                                setNotice("");
                              }}
                              style={{ width: 20, height: 20, accentColor: brand.accentColor }}
                            />
                          </TD>
                        )}
                        <TD style={{ ...td, whiteSpace: "nowrap" }}>
                          <Link
                            to={`/claims/${c.id}`}
                            className="font-bold"
                            style={{ color: brand.primaryColor }}
                          >
                            {c.reference}
                          </Link>
                        </TD>
                        <TD style={{ ...td, minWidth: 260 }}>
                          <div style={{ fontWeight: 600 }}>{c.title ?? c.reference}</div>
                          {c.status === "draft" && c.last_rejection && (
                            <div
                              className="mt-2 flex items-start gap-2"
                              style={{ fontSize: 13, color: brand.accentColor }}
                            >
                              <Icons.AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                              <span>
                                <strong>Returned by {c.last_rejection.decided_by_name}:</strong>{" "}
                                <span style={{ color: "white" }}>{c.last_rejection.comment}</span>
                              </span>
                            </div>
                          )}
                        </TD>
                        <TD style={{ ...td, textAlign: "right", fontWeight: 700 }}>
                          {gbp(c.total_gbp)}
                        </TD>
                        <TD style={td}>{activeLabel}</TD>
                        <TD style={{ ...td, color: brand.neutralColor, whiteSpace: "nowrap" }}>
                          {fmtDate(c.created_at)}
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>
          </section>
        )}

        <section aria-label="Delete a draft" className="flex flex-col gap-4">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-12 md:col-span-3">
              <button
                type="button"
                disabled={!selected}
                onClick={() => (confirming ? void confirmDelete() : setConfirming(true))}
                className="et-btn w-full inline-flex items-center justify-center gap-2 px-4 font-semibold"
                style={{
                  ...glass,
                  minHeight: 48,
                  cursor: "pointer",
                  color: selected ? brand.accentColor : "white",
                }}
              >
                <Icons.Trash className="w-4 h-4" aria-hidden="true" />
                Delete draft
              </button>
            </div>
            <p
              className="col-span-12 md:col-span-9"
              style={{ color: brand.neutralColor, fontSize: 14, margin: 0 }}
            >
              {active !== "draft"
                ? "Only drafts can be deleted. Once a claim is submitted it is locked. Switch to Draft to pick one."
                : selected
                  ? `${selected.reference} is selected. Deleting removes its lines and receipts for good.`
                  : "Tick a draft in the table to delete it. Submitted claims are locked and stay on record."}
            </p>
          </div>
          {confirming && selected && (
            <div role="alert" className="p-6 flex flex-col gap-2" style={glass}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                Delete {selected.reference}?
              </h2>
              <p style={{ margin: 0, fontWeight: 600 }}>
                Press Delete draft again to confirm. Press Escape or untick the draft to keep it.
              </p>
            </div>
          )}
        </section>

        {rows.length === 0 && (
          <section
            className="flex flex-col items-center text-center gap-4 px-6 py-12"
            style={glass}
          >
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
              {hasNone
                ? "No claims yet. Create your first claim."
                : `Nothing in ${activeLabel} right now`}
            </h2>
            <p style={{ color: brand.neutralColor, fontSize: 16, maxWidth: 480, margin: 0 }}>
              {hasNone
                ? "Add a line for each expense, attach its receipt, and send it to your manager when it’s ready."
                : "Claims move here as they progress. Pick another status above to see the rest of your claims."}
            </p>
            {hasNone && (
              <Link
                to="/claim"
                className="et-btn inline-flex items-center gap-2 px-6 font-bold"
                style={primaryBtn}
              >
                <Icons.Plus className="w-4 h-4" aria-hidden="true" />
                New claim
              </Link>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default function Screen() {
  const [client] = React.useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <DashboardView />
    </QueryClientProvider>
  );
}
