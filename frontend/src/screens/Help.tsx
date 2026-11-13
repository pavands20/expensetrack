// @ts-nocheck -- generated from the approved design under its JS runtime contract; not hand-written TypeScript.
import React from "react";

import * as UI from "@/lib/ui";
import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";
import { useNavigate } from "@/lib/navigate";

const { Button } = UI;

const GUIDE_SECTIONS = [
  {
    id: "i-1-0-0",
    nav: "Creating and submitting a claim",
    title: "Creating and submitting a claim",
    lead: "Create a claim, add a line for each expense with a receipt, then submit it. Once submitted, a claim is locked.",
    points: [
      "Every line needs a date, a category (Travel, Meals, Equipment or Other), an amount in GBP above zero with at most two decimal places, and a description.",
      "Add as many lines as you need. The claim shows a running total in GBP.",
      "While a claim is a draft you can edit lines, remove lines or delete the whole claim. Removing a line also removes its receipt.",
      "Submit only works when the claim has at least one line and every line has a receipt. The screen points out any line that is missing one.",
      "After you submit, nobody can edit or delete the claim, including you.",
    ],
  },
  {
    id: "i-1-0-1",
    nav: "Uploading receipts (JPEG, PNG, PDF up to 5 MB)",
    title: "Uploading receipts",
    lead: "Each line carries one receipt. Accepted files are JPEG, PNG and PDF, up to 5 MB each.",
    points: [
      "A file of another type, or larger than 5 MB, is rejected with a message and nothing is attached.",
      "On a draft you can upload a replacement for a line. The new file replaces the old one.",
      "Receipts are stored privately. You, your approving manager and Finance open them through a link that expires after a short time.",
      "Once a claim is submitted, receipts can no longer be uploaded or replaced.",
    ],
  },
  {
    id: "i-1-0-2",
    nav: "What each role can do: Employee, Manager, Finance",
    title: "What each role can do",
    lead: "Everyone can claim their own expenses. Managers and Finance can do more on top of that.",
    roles: [
      {
        name: "Employee",
        text: "Creates, edits and submits their own claims, attaches receipts, and sees only their own claims on the dashboard.",
      },
      {
        name: "Manager",
        text: "Does everything an Employee does, and also sees their direct reports’ claims. Approves or rejects a submitted claim from a direct report, with a comment.",
      },
      {
        name: "Finance",
        text: "Sees all claims. Approves or rejects claims that have passed the manager stage, marks approved claims as paid, manages categories and per-line limits, exports approved claims as CSV, and creates and deactivates accounts.",
      },
    ],
    points: [
      "A comment is required when you reject a claim and optional when you approve.",
      "Marking a claim paid only changes its status. ExpenseTrack does not process any payment.",
    ],
  },
  {
    id: "i-1-0-3",
    nav: "Approval routing and no self approval",
    title: "Approval routing and no self approval",
    lead: "A claim goes to your assigned manager first, then to Finance. Nobody can approve or reject their own claim at any stage.",
    steps: [
      {
        label: "Submitted",
        text: "Awaiting your assigned manager. The manager approves or rejects with a comment.",
      },
      { label: "Manager approved", text: "Awaiting Finance. A Finance user approves or rejects." },
      {
        label: "Approved",
        text: "Finance has signed it off. A Finance user other than the submitter marks it paid.",
      },
      { label: "Paid", text: "Reimbursed. This is a record only; the app moves no money." },
    ],
    points: [
      "No assigned manager: your claim skips the manager stage and goes straight to Finance.",
      "You are a Manager: your claim goes to your own assigned manager first, then to Finance.",
      "You are in Finance: at the Finance stage only a different Finance user can decide your claim. If you are the only Finance user, it waits until another is added.",
      "Rejected at either stage: the claim returns to you as an editable draft with the approver’s name and comment. Fix it and resubmit. The earlier rejection stays in the claim’s history.",
      "A line over its category limit is flagged for the approver. The flag is information only and does not stop you submitting.",
    ],
  },
  {
    id: "i-1-0-4",
    nav: "Not supported: currency conversion, mileage, card feeds, accounting integrations",
    title: "Not supported",
    lead: "ExpenseTrack keeps to GBP expense claims with receipts. These are out of scope:",
    unsupported: [
      ["Currency conversion", "Amounts are entered in GBP only."],
      ["Mileage", "There is no mileage or distance claim type."],
      ["Card feeds", "Bank and card transactions are not imported."],
      [
        "Accounting integrations",
        "Nothing is pushed to accounting software. Finance can export approved claims as CSV instead.",
      ],
    ],
    points: [],
  },
];

export default function Screen() {
  const navigate = useNavigate();
  const [activeId, setActiveId] = React.useState(GUIDE_SECTIONS[0].id);
  const active = GUIDE_SECTIONS.find((s) => s.id === activeId) || GUIDE_SECTIONS[0];

  const glass = {
    backgroundColor: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: brand.radius,
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
  };
  const gradient = `linear-gradient(135deg, ${brand.primaryColor}, ${brand.accentColor})`;
  const num = { fontVariantNumeric: "tabular-nums" };

  return (
    <div
      style={{
        position: "relative",
        fontFamily: brand.fontBody,
        color: "rgba(255,255,255,0.92)",
        backgroundColor: brand.backgroundColor,
        overflow: "hidden",
        minHeight: "100%",
      }}
    >
      <style>{`
        .ug-focus:focus-visible { outline: 2px solid ${brand.primaryColor}; outline-offset: 3px; }
        .ug-item { transition: background-color 160ms ease, border-color 160ms ease, box-shadow 200ms ease; }
        .ug-item:hover { background-color: rgba(255,255,255,0.08); }
        .ug-panel { animation: ug-in 240ms ease both; }
        @keyframes ug-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) {
          .ug-panel { animation: none; }
          .ug-item { transition: none; }
        }
      `}</style>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -160,
          right: -120,
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: brand.accentColor,
          opacity: 0.16,
          filter: "blur(120px)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 240,
          left: -160,
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: brand.primaryColor,
          opacity: 0.12,
          filter: "blur(120px)",
          pointerEvents: "none",
        }}
      />

      <div
        className="relative mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12"
        style={{ position: "relative" }}
      >
        {/* Row 1 */}
        <div data-wf="b-0-0">
          <h1
            style={{
              fontFamily: brand.fontHeading,
              fontSize: "clamp(2.25rem, 6vw, 3.5rem)",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              margin: 0,
              backgroundImage: gradient,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              display: "inline-block",
            }}
          >
            User guide
          </h1>
          <p
            style={{
              color: brand.neutralColor,
              fontSize: 16,
              lineHeight: 1.5,
              marginTop: 12,
              maxWidth: 560,
            }}
          >
            Pick a topic to read how claims work, from the first line to payment.
          </p>
        </div>

        {/* Row 2 */}
        <section data-wf="b-1-0" aria-labelledby="guide-sections-h" style={{ marginTop: 32 }}>
          <h2
            id="guide-sections-h"
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: brand.neutralColor,
              margin: "0 0 12px",
            }}
          >
            Guide sections
          </h2>
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
            {GUIDE_SECTIONS.map((s, i) => {
              const isActive = s.id === active.id;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    data-wf={s.id}
                    className="ug-item ug-focus"
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => setActiveId(s.id)}
                    style={{
                      ...glass,
                      width: "100%",
                      minHeight: 56,
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "12px 16px",
                      textAlign: "left",
                      cursor: "pointer",
                      color: "inherit",
                      fontFamily: "inherit",
                      fontSize: 16,
                      fontWeight: isActive ? 700 : 500,
                      borderColor: isActive ? brand.primaryColor : "rgba(255,255,255,0.14)",
                      boxShadow: isActive ? `0 0 48px -8px ${brand.primaryColor}` : "none",
                      backgroundColor: isActive
                        ? "rgba(255,255,255,0.11)"
                        : "rgba(255,255,255,0.07)",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        ...num,
                        flex: "0 0 32px",
                        height: 32,
                        borderRadius: 999,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 800,
                        background: isActive ? gradient : "transparent",
                        color: isActive ? brand.backgroundColor : brand.neutralColor,
                        border: isActive
                          ? "1px solid transparent"
                          : "1px solid rgba(255,255,255,0.24)",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ flex: 1, lineHeight: 1.4 }}>{s.nav}</span>
                    <span
                      aria-hidden="true"
                      style={{
                        color: isActive ? brand.primaryColor : brand.neutralColor,
                        display: "inline-flex",
                      }}
                    >
                      <Icons.ChevronRight width={18} height={18} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Row 3 */}
        <div
          data-wf="b-2-0"
          key={active.id}
          className="ug-panel"
          aria-live="polite"
          style={{
            ...glass,
            marginTop: 24,
            padding: "24px 24px 32px",
            boxShadow: `0 24px 80px -24px ${brand.accentColor}`,
          }}
        >
          <h3
            style={{
              fontFamily: brand.fontHeading,
              fontSize: 24,
              fontWeight: 800,
              margin: 0,
              lineHeight: 1.25,
            }}
          >
            {active.title}
          </h3>
          <p style={{ fontSize: 18, lineHeight: 1.55, margin: "12px 0 0", maxWidth: 640 }}>
            {active.lead}
          </p>

          {active.roles && (
            <dl style={{ margin: "24px 0 0", display: "grid", gap: 16 }}>
              {active.roles.map((r) => (
                <div
                  key={r.name}
                  style={{ borderLeft: `3px solid ${brand.primaryColor}`, paddingLeft: 16 }}
                >
                  <dt style={{ fontWeight: 700, fontSize: 16 }}>{r.name}</dt>
                  <dd
                    style={{
                      margin: "4px 0 0",
                      color: brand.neutralColor,
                      lineHeight: 1.55,
                      fontSize: 15,
                      maxWidth: 640,
                    }}
                  >
                    {r.text}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {active.steps && (
            <ol
              style={{
                listStyle: "none",
                margin: "24px 0 0",
                padding: 0,
                display: "grid",
                gap: 12,
              }}
            >
              {active.steps.map((st, i) => (
                <li key={st.label} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <span
                    aria-hidden="true"
                    style={{
                      ...num,
                      flex: "0 0 28px",
                      height: 28,
                      borderRadius: 999,
                      background: gradient,
                      color: brand.backgroundColor,
                      fontWeight: 800,
                      fontSize: 13,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 2,
                    }}
                  >
                    {i + 1}
                  </span>
                  <p style={{ margin: 0, lineHeight: 1.55, fontSize: 15, maxWidth: 620 }}>
                    <strong>{st.label}.</strong>{" "}
                    <span style={{ color: brand.neutralColor }}>{st.text}</span>
                  </p>
                </li>
              ))}
            </ol>
          )}

          {active.unsupported && (
            <ul
              style={{
                listStyle: "none",
                margin: "24px 0 0",
                padding: 0,
                display: "grid",
                gap: 12,
              }}
            >
              {active.unsupported.map(([name, why]) => (
                <li key={name} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span
                    style={{
                      flex: "0 0 auto",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "2px 12px",
                      borderRadius: 999,
                      border: `1px solid ${brand.accentColor}`,
                      color: brand.accentColor,
                      fontSize: 12,
                      fontWeight: 700,
                      marginTop: 2,
                    }}
                  >
                    <Icons.X width={12} height={12} aria-hidden="true" />
                    Not supported
                  </span>
                  <p style={{ margin: 0, lineHeight: 1.55, fontSize: 15 }}>
                    <strong>{name}.</strong>{" "}
                    <span style={{ color: brand.neutralColor }}>{why}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}

          {active.points.length > 0 && (
            <ul
              style={{
                margin: "24px 0 0",
                padding: 0,
                listStyle: "none",
                display: "grid",
                gap: 12,
              }}
            >
              {active.points.map((p) => (
                <li key={p} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span
                    aria-hidden="true"
                    style={{
                      color: brand.primaryColor,
                      marginTop: 3,
                      display: "inline-flex",
                      flex: "0 0 auto",
                    }}
                  >
                    <Icons.Check width={16} height={16} />
                  </span>
                  <span
                    style={{
                      lineHeight: 1.55,
                      fontSize: 15,
                      maxWidth: 620,
                      color: "rgba(255,255,255,0.86)",
                    }}
                  >
                    {p}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Row 4 */}
        <div className="grid grid-cols-12" style={{ marginTop: 32 }}>
          <div className="col-span-12 md:col-span-4">
            <Button
              data-wf="b-3-0"
              type="button"
              className="ug-focus"
              onClick={() => navigate("claim")}
              style={{
                width: "100%",
                minHeight: 48,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: gradient,
                color: brand.backgroundColor,
                border: "none",
                borderRadius: brand.radius,
                fontFamily: brand.fontBody,
                fontSize: 16,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: `0 12px 64px -8px ${brand.accentColor}`,
              }}
            >
              <Icons.Plus width={18} height={18} aria-hidden="true" />
              Start a new claim
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
