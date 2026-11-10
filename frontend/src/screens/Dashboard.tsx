// @ts-nocheck -- generated from the approved design under its JS runtime contract; not hand-written TypeScript.
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";

import * as UI from "@/lib/ui";
import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";
import { useNavigate } from "@/lib/navigate";

 
const { Select, Switch, Table, THead, TBody, TR, TH, TD } = UI;
 
const { Check, Home, Clock, Edit, ArrowLeft, ArrowRight, CheckCircle } = Icons;

const STATUSES = [
  { key: "draft", label: "Draft", icon: "Edit" },
  { key: "submitted", label: "Submitted", icon: "Clock" },
  { key: "manager_approved", label: "Manager approved", icon: "CheckCircle" },
  { key: "approved", label: "Approved", icon: "Check" },
  { key: "paid", label: "Paid", icon: "CheckCircle" },
];

const INITIAL_CLAIMS = [
  {
    id: "c-415",
    reference: "CLM-0415",
    title: "Team lunch – Q4 planning offsite",
    total: 96.4,
    status: "draft",
    updated: "10 Nov 2026",
  },
  {
    id: "c-412",
    reference: "CLM-0412",
    title: "Manchester client visit – November",
    total: 184.6,
    status: "draft",
    updated: "9 Nov 2026",
    note: {
      by: "Priya Raman",
      text: "The taxi receipt on line 2 is unreadable. Please re-upload it and resubmit.",
    },
  },
  {
    id: "c-409",
    reference: "CLM-0409",
    title: "Standing desk and monitor arm",
    total: 329.98,
    status: "submitted",
    updated: "6 Nov 2026",
  },
  {
    id: "c-406",
    reference: "CLM-0406",
    title: "Lisbon conference – flights and hotel",
    total: 642.15,
    status: "manager_approved",
    updated: "4 Nov 2026",
  },
  {
    id: "c-398",
    reference: "CLM-0398",
    title: "October train season top-up",
    total: 118.0,
    status: "paid",
    updated: "29 Oct 2026",
  },
  {
    id: "c-391",
    reference: "CLM-0391",
    title: "Client dinner – Harlow Studio",
    total: 212.75,
    status: "paid",
    updated: "21 Oct 2026",
  },
  {
    id: "c-384",
    reference: "CLM-0384",
    title: "Laptop sleeve and USB hub",
    total: 67.49,
    status: "paid",
    updated: "8 Oct 2026",
  },
];

const gbp = (n) =>
  "£" + n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Screen() {
  const navigate = useNavigate();
  const [claims, setClaims] = React.useState(INITIAL_CLAIMS);
  const [active, setActive] = React.useState("draft");
  const [selectedId, setSelectedId] = React.useState(null);
  const [confirming, setConfirming] = React.useState(false);
  const [notice, setNotice] = React.useState("");

  const counts = {};
  STATUSES.forEach((s) => {
    counts[s.key] = claims.filter((c) => c.status === s.key).length;
  });
  const rows = claims.filter((c) => c.status === active);
  const activeStatus = STATUSES.find((s) => s.key === active);
  const selected = claims.find((c) => c.id === selectedId);
  const inReview = claims
    .filter((c) => c.status === "submitted" || c.status === "manager_approved")
    .reduce((sum, c) => sum + c.total, 0);

  const glass = {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.14)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderRadius: brand.radius,
  };
  const gradient = `linear-gradient(120deg, ${brand.primaryColor}, ${brand.accentColor})`;
  const glow = (c, a) => `0 0 48px 4px color-mix(in srgb, ${c} ${a}%, transparent)`;

  const changeTab = (key) => {
    setActive(key);
    setSelectedId(null);
    setConfirming(false);
    setNotice("");
  };

  const onTabKey = (e, i) => {
    let n = null;
    if (e.key === "ArrowRight") n = (i + 1) % STATUSES.length;
    if (e.key === "ArrowLeft") n = (i - 1 + STATUSES.length) % STATUSES.length;
    if (e.key === "Home") n = 0;
    if (e.key === "End") n = STATUSES.length - 1;
    if (n === null) return;
    e.preventDefault();
    changeTab(STATUSES[n].key);
    const el = document.getElementById("tab-" + STATUSES[n].key);
    if (el) el.focus();
  };

  const confirmDelete = () => {
    if (!selected) return;
    setClaims((cs) => cs.filter((c) => c.id !== selected.id));
    setNotice(
      `${selected.reference} “${selected.title}” was deleted, along with its lines and receipts.`,
    );
    setSelectedId(null);
    setConfirming(false);
  };

  const pill = (s) => {
    const Ic = Icons[s.icon];
    const tone =
      s.key === "draft"
        ? brand.neutralColor
        : s.key === "paid" || s.key === "approved"
          ? brand.accentColor
          : brand.primaryColor;
    return (
      <span
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
        style={{
          color: tone,
          border: `1px solid color-mix(in srgb, ${tone} 55%, transparent)`,
          background: `color-mix(in srgb, ${tone} 14%, transparent)`,
        }}
      >
        <Ic className="w-3 h-3" aria-hidden="true" />
        {s.label}
      </span>
    );
  };

  const thStyle = {
    color: brand.neutralColor,
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontWeight: 600,
    padding: "16px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.14)",
    background: "transparent",
  };
  const tdStyle = {
    padding: "16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    verticalAlign: "top",
    color: "white",
    background: "transparent",
  };

  const hasNone = claims.length === 0;

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
        .et-root button:focus-visible, .et-root input:focus-visible { outline: 2px solid ${brand.accentColor}; outline-offset: 3px; }
        .et-btn { transition: transform .15s ease, box-shadow .2s ease, background .2s ease; }
        .et-btn:not(:disabled):hover { transform: translateY(-1px); }
        .et-btn:not(:disabled):active { transform: translateY(0); }
        .et-btn:disabled { opacity: .5; cursor: not-allowed; }
        .et-row { transition: background .15s ease; cursor: pointer; }
        .et-row:hover { background: rgba(255,255,255,0.06); }
        .et-ref { text-decoration: underline; text-decoration-color: transparent; transition: text-decoration-color .15s; }
        .et-ref:hover { text-decoration-color: currentColor; }
        @keyframes et-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .et-in { animation: et-in .28s ease both; }
        @media (prefers-reduced-motion: reduce) { .et-in { animation: none; } .et-btn, .et-row { transition: none; } .et-btn:not(:disabled):hover { transform: none; } }
      `}</style>

      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Row 1 */}
        <header className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-12 md:col-span-8" data-wf="b-0-0">
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
            <p
              className="mt-3"
              style={{ color: brand.neutralColor, fontSize: 16, lineHeight: 1.5 }}
            >
              <span
                style={{
                  color: brand.primaryColor,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {gbp(inReview)}
              </span>{" "}
              is with your approvers right now.
            </p>
          </div>
          <div className="col-span-6 md:col-span-2">
            <button
              type="button"
              data-wf="b-0-1"
              onClick={() => navigate("claim")}
              className="et-btn w-full inline-flex items-center justify-center gap-2 px-4 font-bold"
              style={{
                minHeight: 48,
                borderRadius: brand.radius,
                background: gradient,
                color: brand.backgroundColor,
                border: "none",
                boxShadow: glow(brand.accentColor, 45),
                cursor: "pointer",
              }}
            >
              <Icons.Plus className="w-4 h-4" aria-hidden="true" />
              New claim
            </button>
          </div>
        </header>

        {notice && (
          <div
            role="status"
            className="et-in flex items-start justify-between gap-4 px-4 py-3"
            style={{
              ...glass,
              borderColor: `color-mix(in srgb, ${brand.primaryColor} 60%, transparent)`,
            }}
          >
            <span className="flex items-start gap-3" style={{ fontSize: 14, lineHeight: 1.5 }}>
              <Icons.CheckCircle
                className="w-5 h-5 shrink-0"
                style={{ color: brand.primaryColor }}
                aria-hidden="true"
              />
              {notice}
            </span>
          </div>
        )}

        {/* Row 2 */}
        <section aria-labelledby="status-heading" data-wf="b-1-0">
          <h2 id="status-heading" className="sr-only">
            Status
          </h2>
          <div role="tablist" aria-label="Status" className="flex flex-wrap gap-2">
            {STATUSES.map((s, i) => {
              const on = s.key === active;
              const itemIds = ["i-1-0-0", "i-1-0-1", "i-1-0-2", "i-1-0-3", "i-1-0-4"];
              return (
                <button
                  key={s.key}
                  id={"tab-" + s.key}
                  type="button"
                  role="tab"
                  data-wf={itemIds[i]}
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
                    boxShadow: on ? glow(brand.primaryColor, 35) : "none",
                  }}
                >
                  {s.label}
                  <span
                    className="inline-flex items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      minWidth: 24,
                      height: 24,
                      padding: "0 8px",
                      fontVariantNumeric: "tabular-nums",
                      background: on ? "rgba(6,20,43,0.18)" : "rgba(255,255,255,0.12)",
                      color: on ? brand.backgroundColor : "white",
                    }}
                  >
                    {counts[s.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Row 3 */}
        <section
          id="claims-panel"
          role="tabpanel"
          aria-labelledby={"tab-" + active}
          data-wf="b-2-0"
          style={{
            ...glass,
            overflow: "hidden",
            boxShadow: "0 30px 80px 0 rgba(0,0,0,0.35)",
            display: rows.length === 0 ? "none" : "block",
          }}
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
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <THead>
                <TR style={{ background: "transparent" }}>
                  {active === "draft" && (
                    <TH style={{ ...thStyle, width: 56 }} scope="col">
                      <span className="sr-only">Select draft to delete</span>
                    </TH>
                  )}
                  <TH scope="col" data-wf="i-2-0-0" style={{ ...thStyle, textAlign: "left" }}>
                    Reference
                  </TH>
                  <TH scope="col" data-wf="i-2-0-1" style={{ ...thStyle, textAlign: "left" }}>
                    Title
                  </TH>
                  <TH scope="col" data-wf="i-2-0-2" style={{ ...thStyle, textAlign: "right" }}>
                    Total (GBP)
                  </TH>
                  <TH scope="col" data-wf="i-2-0-3" style={{ ...thStyle, textAlign: "left" }}>
                    Status
                  </TH>
                  <TH scope="col" data-wf="i-2-0-4" style={{ ...thStyle, textAlign: "left" }}>
                    Updated
                  </TH>
                </TR>
              </THead>
              <TBody key={active}>
                {rows.map((c, idx) => {
                  const st = STATUSES.find((s) => s.key === c.status);
                  const isSel = c.id === selectedId;
                  return (
                    <TR
                      key={c.id}
                      className="et-row et-in"
                      onClick={() => navigate("claim")}
                      style={{
                        animationDelay: idx * 40 + "ms",
                        background: isSel
                          ? `color-mix(in srgb, ${brand.accentColor} 14%, transparent)`
                          : undefined,
                      }}
                    >
                      {active === "draft" && (
                        <TD style={{ ...tdStyle, width: 56 }} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={`Select draft ${c.reference} for deletion`}
                            checked={isSel}
                            onChange={() => {
                              setSelectedId(isSel ? null : c.id);
                              setConfirming(false);
                              setNotice("");
                            }}
                            style={{
                              width: 20,
                              height: 20,
                              accentColor: brand.accentColor,
                              cursor: "pointer",
                            }}
                          />
                        </TD>
                      )}
                      <TD style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                        <button
                          type="button"
                          data-wf="r-claim"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("claim");
                          }}
                          className="et-ref inline-flex items-center gap-1 font-bold"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: brand.primaryColor,
                            cursor: "pointer",
                            padding: 0,
                            minHeight: 24,
                            fontSize: 14,
                          }}
                          aria-label={`Open claim ${c.reference}`}
                        >
                          {c.reference}
                          <Icons.ChevronRight className="w-3 h-3" aria-hidden="true" />
                        </button>
                      </TD>
                      <TD style={{ ...tdStyle, minWidth: 260 }}>
                        <div style={{ fontWeight: 600, lineHeight: 1.4 }}>{c.title}</div>
                        {c.note && (
                          <div
                            className="mt-2 flex items-start gap-2"
                            style={{ fontSize: 13, lineHeight: 1.5, color: brand.accentColor }}
                          >
                            <Icons.AlertCircle
                              className="w-4 h-4 shrink-0"
                              style={{ marginTop: 2 }}
                              aria-hidden="true"
                            />
                            <span>
                              <strong>Returned by {c.note.by}:</strong>{" "}
                              <span style={{ color: "white" }}>{c.note.text}</span>
                            </span>
                          </div>
                        )}
                      </TD>
                      <TD
                        style={{
                          ...tdStyle,
                          textAlign: "right",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {gbp(c.total)}
                      </TD>
                      <TD style={tdStyle}>{pill(st)}</TD>
                      <TD
                        style={{
                          ...tdStyle,
                          color: brand.neutralColor,
                          whiteSpace: "nowrap",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {c.updated}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </div>
        </section>

        {/* Row 4 */}
        <section
          aria-label="Delete a draft"
          className="flex flex-col gap-4"
          onKeyDown={(e) => {
            if (e.key === "Escape" && confirming) setConfirming(false);
          }}
        >
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-12 md:col-span-3">
              <button
                type="button"
                data-wf="b-3-0"
                disabled={!selected}
                onClick={() => {
                  if (confirming) confirmDelete();
                  else setConfirming(true);
                }}
                className="et-btn w-full inline-flex items-center justify-center gap-2 px-4 font-semibold"
                style={{
                  ...glass,
                  minHeight: 48,
                  cursor: "pointer",
                  color: selected ? brand.accentColor : "white",
                  borderColor: selected
                    ? `color-mix(in srgb, ${brand.accentColor} 65%, transparent)`
                    : "rgba(255,255,255,0.14)",
                  boxShadow: confirming ? glow(brand.accentColor, 25) : undefined,
                }}
              >
                <Icons.Trash className="w-4 h-4" aria-hidden="true" />
                Delete draft
              </button>
            </div>
            <p
              className="col-span-12 md:col-span-9"
              style={{ color: brand.neutralColor, fontSize: 14, lineHeight: 1.5, margin: 0 }}
            >
              {active !== "draft"
                ? "Only drafts can be deleted. Once a claim is submitted it is locked. Switch to Draft to pick one."
                : selected
                  ? `${selected.reference} is selected. Deleting removes its lines and receipts for good.`
                  : "Tick a draft in the table to delete it. Submitted claims are locked and stay on record."}
            </p>
          </div>

          {confirming && selected && (
            <div
              role="alert"
              className="et-in p-6 flex flex-col gap-2"
              style={{
                ...glass,
                borderColor: `color-mix(in srgb, ${brand.accentColor} 60%, transparent)`,
                boxShadow: glow(brand.accentColor, 25),
              }}
            >
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                Delete {selected.reference}?
              </h2>
              <p style={{ color: brand.neutralColor, fontSize: 14, lineHeight: 1.5, margin: 0 }}>
                “{selected.title}” ({gbp(selected.total)}), its lines and its receipts will be
                removed. This can’t be undone.
              </p>
              <p
                style={{
                  color: "white",
                  fontSize: 14,
                  lineHeight: 1.5,
                  margin: 0,
                  fontWeight: 600,
                }}
              >
                Press Delete draft again to confirm. Press Escape or untick the draft to keep it.
              </p>
            </div>
          )}
        </section>

        {/* Row 5 */}
        {rows.length === 0 && (
          <section
            data-wf="b-4-0"
            className="et-in flex flex-col items-center text-center gap-4 px-6 py-12"
            style={{ ...glass, boxShadow: glow(brand.primaryColor, 18) }}
          >
            <span
              className="inline-flex items-center justify-center rounded-full"
              style={{
                width: 64,
                height: 64,
                background: gradient,
                color: brand.backgroundColor,
                boxShadow: glow(brand.accentColor, 40),
              }}
            >
              <Icons.FileText className="w-6 h-6" aria-hidden="true" />
            </span>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
              {hasNone
                ? "No claims yet. Create your first claim."
                : `Nothing in ${activeStatus.label} right now`}
            </h2>
            <p
              style={{
                color: brand.neutralColor,
                fontSize: 16,
                lineHeight: 1.5,
                maxWidth: 480,
                margin: 0,
              }}
            >
              {hasNone
                ? "Add a line for each expense, attach its receipt, and send it to your manager when it’s ready."
                : active === "approved"
                  ? "Claims wait here after Finance signs them off, until they are marked paid. Check Manager approved to see what is next in line."
                  : "Claims move here as they progress. Pick another status above to see the rest of your claims."}
            </p>
            {hasNone && (
              <button
                type="button"
                onClick={() => navigate("claim")}
                className="et-btn inline-flex items-center gap-2 px-6 font-bold"
                style={{
                  minHeight: 48,
                  borderRadius: brand.radius,
                  background: gradient,
                  color: brand.backgroundColor,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: glow(brand.accentColor, 45),
                }}
              >
                <Icons.Plus className="w-4 h-4" aria-hidden="true" />
                New claim
              </button>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
