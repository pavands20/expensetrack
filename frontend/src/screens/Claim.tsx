// @ts-nocheck -- generated from the approved design under its JS runtime contract; not hand-written TypeScript.
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";

import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";
import { useNavigate } from "@/lib/navigate";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { Edit } = Icons;

const CATEGORIES = ["Travel", "Meals", "Equipment", "Other"];

const INITIAL_LINES = [
  { id: "ln-1", date: "2026-11-03", category: "Travel", amount: "48.50", description: "Rail return Manchester Piccadilly to London Euston", receipt: { name: "avanti-return-3nov.pdf", size: 184320 } },
  { id: "ln-2", date: "2026-11-03", category: "Meals", amount: "22.00", description: "Working lunch with Halden & Rowe, Clerkenwell", receipt: { name: "lunch-clerkenwell.jpg", size: 902144 } },
  { id: "ln-3", date: "2026-11-04", category: "Travel", amount: "14.00", description: "Taxi from Euston to client office", receipt: null },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_BYTES = 5 * 1024 * 1024;

function fmtDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return Number(d) + " " + MONTHS[Number(m) - 1] + " " + y;
}
function fmtGBP(n) {
  return "£" + Number(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtSize(b) {
  if (b >= 1024 * 1024) return (b / (1024 * 1024)).toFixed(1) + " MB";
  return Math.max(1, Math.round(b / 1024)) + " KB";
}
function validateLine(f) {
  const e = {};
  if (!f.date) e.date = "Pick the date you spent the money.";
  if (!CATEGORIES.includes(f.category)) e.category = "Choose one of Travel, Meals, Equipment or Other.";
  const amt = f.amount.trim();
  if (!amt) e.amount = "Enter the amount in pounds.";
  else if (!/^\d+(\.\d{1,2})?$/.test(amt)) e.amount = "Use pounds and pence, like 12.50: a positive number with at most two decimals.";
  else if (Number(amt) <= 0) e.amount = "The amount must be more than £0.00.";
  if (!f.description.trim()) e.description = "Add a short description so your approver knows what this was.";
  return e;
}

const EMPTY_FORM = { date: "", category: "", amount: "", description: "" };

export default function Screen() {
  const navigate = useNavigate();
  const [title, setTitle] = React.useState("London client visit");
  const [status, setStatus] = React.useState("Draft");
  const [lines, setLines] = React.useState(INITIAL_LINES);
  const [editingId, setEditingId] = React.useState(null);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [pending, setPending] = React.useState(null);
  const [fileKey, setFileKey] = React.useState(0);
  const [errors, setErrors] = React.useState({});
  const [notice, setNotice] = React.useState("");
  const [problems, setProblems] = React.useState([]);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [newId, setNewId] = React.useState(null);

  const dateRef = React.useRef(null);
  const problemsRef = React.useRef(null);
  const cancelRef = React.useRef(null);
  const deleteRef = React.useRef(null);
  const deleteBtnRef = React.useRef(null);
  const wasOpen = React.useRef(false);

  const locked = status !== "Draft";
  const total = lines.reduce((s, l) => s + Number(l.amount), 0);
  const editingLine = lines.find((l) => l.id === editingId) || null;

  React.useEffect(() => {
    if (confirmOpen) {
      wasOpen.current = true;
      if (cancelRef.current) cancelRef.current.focus();
    } else if (wasOpen.current) {
      wasOpen.current = false;
      if (deleteBtnRef.current) deleteBtnRef.current.focus();
    }
  }, [confirmOpen]);

  React.useEffect(() => {
    if (problems.length && problemsRef.current) problemsRef.current.focus();
  }, [problems]);

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setPending(null);
    setErrors({});
    setFileKey((k) => k + 1);
  }

  function onFile(ev) {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_BYTES) {
      setErrors((e) => ({ ...e, receipt: "“" + file.name + "” was not attached. Receipts must be JPEG, PNG or PDF files of 5 MB or less." }));
      setPending(null);
      setFileKey((k) => k + 1);
      return;
    }
    setErrors((e) => ({ ...e, receipt: undefined }));
    setPending({ name: file.name, size: file.size });
  }

  function startEdit(line) {
    if (editingId === line.id) {
      setEditingId(null);
      resetForm();
      setNotice("Stopped editing. Your changes to that line were not saved.");
      return;
    }
    setEditingId(line.id);
    setForm({ date: line.date, category: line.category, amount: Number(line.amount).toFixed(2), description: line.description });
    setPending(null);
    setErrors({});
    setFileKey((k) => k + 1);
    setNotice("Editing the line from " + fmtDate(line.date) + ". Change it below, then choose Save line.");
    if (dateRef.current) {
      dateRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      dateRef.current.focus({ preventScroll: true });
    }
  }

  function onSubmitForm(ev) {
    ev.preventDefault();
    const e = validateLine(form);
    if (Object.keys(e).length) {
      setErrors((prev) => ({ ...e, receipt: prev.receipt }));
      return;
    }
    setProblems([]);
    if (editingId) {
      setLines((ls) => ls.map((l) => (l.id === editingId ? { ...l, date: form.date, category: form.category, amount: Number(form.amount).toFixed(2), description: form.description.trim(), receipt: pending || l.receipt } : l)));
      setNotice("Line saved: " + form.category + ", " + fmtGBP(form.amount) + ". The total is now updated.");
      setEditingId(null);
    } else {
      const id = "ln-" + Date.now();
      setLines((ls) => [...ls, { id, date: form.date, category: form.category, amount: Number(form.amount).toFixed(2), description: form.description.trim(), receipt: pending }]);
      setNewId(id);
      setNotice("Line added: " + form.category + ", " + fmtGBP(form.amount) + "." + (pending ? "" : " It still needs a receipt before you can submit."));
    }
    resetForm();
    if (dateRef.current) dateRef.current.focus();
  }

  function removeLine() {
    if (!editingLine) return;
    if (lines.length <= 1) {
      setNotice("");
      setErrors((e) => ({ ...e, remove: "A claim needs at least one line. To start over, delete the draft instead." }));
      return;
    }
    setLines((ls) => ls.filter((l) => l.id !== editingId));
    setNotice("Line removed along with its receipt. The total is now updated.");
    setEditingId(null);
    setProblems([]);
    resetForm();
  }

  function submitClaim() {
    const list = [];
    if (lines.length === 0) list.push("Add at least one line before you submit.");
    if (!title.trim()) list.push("Give the claim a title, so your approver can tell it apart.");
    lines.forEach((l, i) => {
      if (!l.receipt) list.push("Line " + (i + 1) + " (" + l.description + ") has no receipt. Choose Edit on that line to attach one.");
    });
    if (list.length) {
      setProblems(list);
      return;
    }
    setProblems([]);
    setStatus("Submitted");
    navigate("dashboard");
  }

  function onDialogKey(ev) {
    if (ev.key === "Escape") {
      ev.preventDefault();
      setConfirmOpen(false);
    } else if (ev.key === "Tab") {
      const first = cancelRef.current;
      const last = deleteRef.current;
      if (ev.shiftKey && document.activeElement === first) {
        ev.preventDefault();
        last.focus();
      } else if (!ev.shiftKey && document.activeElement === last) {
        ev.preventDefault();
        first.focus();
      }
    }
  }

  const missingIds = problems.length ? lines.filter((l) => !l.receipt).map((l) => l.id) : [];

  const css = `
  .xt-root{--p:${brand.primaryColor};--a:${brand.accentColor};--n:${brand.neutralColor};--bg:${brand.backgroundColor};--r:${brand.radius};
    --ink:rgb(255 255 255 / .95);--hair:rgb(255 255 255 / .14);
    color-scheme:dark;color:var(--ink);font-family:${brand.fontBody};min-height:100%;position:relative;overflow:hidden;
    background:radial-gradient(900px 480px at 8% -10%,color-mix(in srgb,var(--a) 26%,transparent),transparent 70%),radial-gradient(800px 520px at 100% 0%,color-mix(in srgb,var(--p) 22%,transparent),transparent 70%),var(--bg);
    padding:32px;font-size:15px;line-height:1.5}
  .xt-root *{box-sizing:border-box}
  .xt-wrap{max-width:1120px;margin:0 auto;display:flex;flex-direction:column;gap:24px;position:relative}
  .xt-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:16px;align-items:start}
  .c3{grid-column:span 3}.c4{grid-column:span 4}.c6{grid-column:span 6}.c9{grid-column:span 9}.c12{grid-column:span 12}.c2{grid-column:span 2}
  @media (max-width:900px){.c9,.c6,.c12{grid-column:span 12}.c3,.c4,.c2{grid-column:span 6}}
  @media (max-width:560px){.c3,.c4,.c2{grid-column:span 12}.xt-root{padding:16px}}
  .xt-glass{background:rgb(255 255 255 / .07);border:1px solid var(--hair);border-radius:var(--r);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 30px 90px -30px rgb(0 0 0 / .6)}
  .xt-h1{font-family:${brand.fontHeading};font-size:40px;line-height:1.1;font-weight:800;letter-spacing:-0.02em;margin:0}
  .xt-h2{font-family:${brand.fontHeading};font-size:22px;line-height:1.2;font-weight:700;margin:0}
  .xt-meta{color:var(--n);margin:12px 0 0;font-size:14px}
  .xt-label{display:block;font-size:13px;font-weight:600;letter-spacing:.02em;color:var(--n);margin-bottom:8px}
  .xt-input{width:100%;min-height:48px;padding:10px 16px;background:rgb(255 255 255 / .06);border:1px solid rgb(255 255 255 / .2);border-radius:var(--r);color:var(--ink);font:inherit;transition:border-color .15s,box-shadow .15s,background .15s}
  .xt-input::placeholder{color:var(--n);opacity:.8}
  .xt-input:hover:not(:disabled):not(:read-only){border-color:rgb(255 255 255 / .35)}
  .xt-input:focus-visible,.xt-btn:focus-visible,.xt-link:focus-visible{outline:3px solid var(--p);outline-offset:2px}
  .xt-input:focus-visible{border-color:var(--p);box-shadow:0 0 32px -4px color-mix(in srgb,var(--p) 55%,transparent)}
  .xt-input[aria-invalid="true"]{border-color:var(--a)}
  .xt-input:read-only,.xt-input:disabled{background:transparent;border-color:var(--hair)}
  .xt-title-input{font-size:20px;font-weight:700;min-height:56px}
  select.xt-input option{background:var(--bg);color:var(--ink)}
  .xt-money{position:relative}.xt-money span{position:absolute;left:16px;top:50%;transform:translateY(-50%);color:var(--n);pointer-events:none}
  .xt-money .xt-input{padding-left:32px;font-variant-numeric:tabular-nums}
  .xt-file::file-selector-button{margin-right:12px;padding:8px 16px;border-radius:var(--r);border:1px solid rgb(255 255 255 / .25);background:rgb(255 255 255 / .08);color:var(--ink);font:inherit;font-weight:600;cursor:pointer}
  .xt-file{padding:8px 12px;color:var(--n)}
  .xt-err{display:flex;gap:8px;align-items:flex-start;margin:8px 0 0;font-size:13px;color:var(--a);font-weight:600}
  .xt-hint{margin:8px 0 0;font-size:13px;color:var(--n)}
  .xt-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:52px;padding:0 20px;border-radius:var(--r);font:inherit;font-weight:700;cursor:pointer;border:1px solid rgb(255 255 255 / .22);background:rgb(255 255 255 / .07);color:var(--ink);transition:transform .15s,box-shadow .2s,background .2s,border-color .2s}
  .xt-btn:hover:not(:disabled){background:rgb(255 255 255 / .13);border-color:rgb(255 255 255 / .4);transform:translateY(-1px)}
  .xt-btn:active:not(:disabled){transform:translateY(0)}
  .xt-btn:disabled{opacity:.42;cursor:not-allowed}
  .xt-btn-primary{border:0;color:var(--bg);background:linear-gradient(100deg,var(--p),var(--a));box-shadow:0 12px 56px -8px color-mix(in srgb,var(--a) 65%,transparent)}
  .xt-btn-primary:hover:not(:disabled){background:linear-gradient(100deg,var(--p),var(--a));box-shadow:0 16px 72px -6px color-mix(in srgb,var(--a) 85%,transparent)}
  .xt-btn-main{border:1px solid color-mix(in srgb,var(--p) 70%,transparent);color:var(--p);background:color-mix(in srgb,var(--p) 10%,transparent)}
  .xt-btn-main:hover:not(:disabled){background:color-mix(in srgb,var(--p) 20%,transparent);border-color:var(--p)}
  .xt-btn-warn{border-color:color-mix(in srgb,var(--a) 60%,transparent);color:var(--a)}
  .xt-btn-warn:hover:not(:disabled){background:color-mix(in srgb,var(--a) 16%,transparent);border-color:var(--a)}
  .xt-btn-sm{min-height:40px;width:auto;padding:0 16px;font-size:14px}
  .xt-table-wrap{overflow-x:auto}
  .xt-table{width:100%;border-collapse:collapse;min-width:760px;font-variant-numeric:tabular-nums}
  .xt-table th{text-align:left;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--n);padding:12px 16px;border-bottom:1px solid var(--hair);white-space:nowrap}
  .xt-table td{padding:16px;border-bottom:1px solid rgb(255 255 255 / .09);vertical-align:middle}
  .xt-table tbody tr:last-child td{border-bottom:0}
  .xt-table .num{text-align:right}
  .xt-table tr.xt-edit td{background:color-mix(in srgb,var(--p) 11%,transparent)}
  .xt-table tr.xt-miss td{background:color-mix(in srgb,var(--a) 9%,transparent)}
  .xt-row-in{animation:xt-in .45s ease-out}
  @keyframes xt-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
  .xt-pill{display:inline-flex;align-items:center;gap:8px;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:600;border:1px solid}
  .xt-pill-ok{color:var(--p);border-color:color-mix(in srgb,var(--p) 50%,transparent);background:color-mix(in srgb,var(--p) 10%,transparent)}
  .xt-pill-miss{color:var(--a);border-color:color-mix(in srgb,var(--a) 55%,transparent);background:color-mix(in srgb,var(--a) 10%,transparent)}
  .xt-cat{display:inline-block;padding:2px 12px;border-radius:999px;font-size:13px;font-weight:600;border:1px solid rgb(255 255 255 / .22)}
  .xt-total{font-size:44px;line-height:1;font-weight:800;letter-spacing:-0.02em;font-variant-numeric:tabular-nums;background:linear-gradient(100deg,var(--p),var(--a));-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 24px color-mix(in srgb,var(--a) 45%,transparent))}
  .xt-total-label{display:block;font-size:13px;font-weight:600;letter-spacing:.02em;color:var(--n);margin-bottom:4px}
  .xt-dot{width:10px;height:10px;border-radius:999px;background:var(--p);box-shadow:0 0 0 0 color-mix(in srgb,var(--p) 70%,transparent);animation:xt-pulse 2s infinite;display:inline-block}
  @keyframes xt-pulse{70%{box-shadow:0 0 0 10px transparent}100%{box-shadow:0 0 0 0 transparent}}
  .xt-panel{animation:xt-in .3s ease-out;padding:16px 24px;border-color:color-mix(in srgb,var(--a) 55%,transparent)}
  .xt-panel:focus-visible{outline:3px solid var(--p);outline-offset:2px}
  .xt-overlay{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:16px;background:color-mix(in srgb,var(--bg) 78%,transparent);backdrop-filter:blur(6px);animation:xt-fade .2s ease-out}
  .xt-dialog{width:100%;max-width:480px;padding:32px;background:color-mix(in srgb,var(--bg) 86%,white);animation:xt-pop .25s ease-out;box-shadow:0 40px 120px -10px rgb(0 0 0 / .75),0 0 80px -20px var(--a)}
  @keyframes xt-fade{from{opacity:0}to{opacity:1}}
  @keyframes xt-pop{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}
  .xt-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
  @media (prefers-reduced-motion:reduce){.xt-root *,.xt-overlay,.xt-dialog{animation:none !important;transition:none !important}}
  `;

  const Err = ({ id, children }) => (
    <p id={id} className="xt-err">
      <Icons.AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" style={{ marginTop: 2 }} />
      <span>{children}</span>
    </p>
  );

  return (
    <div className="xt-root">
      <style>{css}</style>
      <div className="xt-wrap">
        {/* Row 1 */}
        <div className="xt-grid">
          <div className="c9" data-wf="b-0-0">
            <h1 className="xt-h1">Claim EXP-0042 — {status}</h1>
            <p className="xt-meta">
              <span className="xt-dot" aria-hidden="true" style={{ marginRight: 12 }} />
              {locked
                ? "Submitted and locked. It can't be edited or deleted. It is now with Marcus Hale for approval, then Finance."
                : "Owner: Priya Raman · Started 3 Nov 2026 · When you submit, it goes to Marcus Hale, then Finance."}
            </p>
          </div>
          <div className="c3">
            <button type="button" className="xt-btn" data-wf="b-0-1" onClick={() => navigate("dashboard")}>
              <Icons.ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Back to my claims
            </button>
          </div>
        </div>

        {/* Row 2 */}
        <div className="xt-glass" style={{ padding: 24 }} data-wf="b-1-0">
          <label className="xt-label" htmlFor="claim-title">Claim title</label>
          <input
            id="claim-title"
            className={"xt-input xt-title-input"}
            value={title}
            readOnly={locked}
            maxLength={80}
            aria-invalid={!title.trim() && problems.length > 0 ? "true" : "false"}
            onChange={(e) => setTitle(e.target.value)}
          />
          <p className="xt-hint">{locked ? "The title is locked with the rest of the claim." : "Changes to the title are kept as you type."}</p>
        </div>

        {/* Row 3 */}
        <section className="xt-glass" style={{ padding: 24 }} data-wf="b-2-0" aria-labelledby="lines-h">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            <h2 className="xt-h2" id="lines-h">Claim lines</h2>
            <span style={{ color: "var(--n)", fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
              {lines.length} {lines.length === 1 ? "line" : "lines"} · {lines.filter((l) => l.receipt).length} with receipts
            </span>
          </div>
          <div className="xt-table-wrap">
            <table className="xt-table" aria-labelledby="lines-h">
              <thead>
                <tr>
                  <th scope="col" data-wf="i-2-0-0">Date</th>
                  <th scope="col" data-wf="i-2-0-1">Category</th>
                  <th scope="col" className="num" data-wf="i-2-0-2" style={{ textAlign: "right" }}>Amount (GBP)</th>
                  <th scope="col" data-wf="i-2-0-3">Description</th>
                  <th scope="col" data-wf="i-2-0-4">Receipt</th>
                  <th scope="col" data-wf="i-2-0-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: "48px 16px", textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>No lines on this claim yet</p>
                      <p style={{ margin: "8px 0 0", color: "var(--n)" }}>Add the first expense below: a date, category, amount, description and its receipt.</p>
                    </td>
                  </tr>
                )}
                {lines.map((l) => (
                  <tr key={l.id} className={(l.id === newId ? "xt-row-in " : "") + (l.id === editingId ? "xt-edit" : missingIds.includes(l.id) ? "xt-miss" : "")}>
                    <td style={{ whiteSpace: "nowrap" }}>{fmtDate(l.date)}</td>
                    <td><span className="xt-cat">{l.category}</span></td>
                    <td className="num" style={{ textAlign: "right", fontWeight: 700 }}>{fmtGBP(l.amount)}</td>
                    <td style={{ maxWidth: 280 }}>{l.description}</td>
                    <td>
                      {l.receipt ? (
                        <span className="xt-pill xt-pill-ok" title={l.receipt.name + " · " + fmtSize(l.receipt.size)}>
                          <Icons.CheckCircle className="w-4 h-4" aria-hidden="true" />
                          Attached · {fmtSize(l.receipt.size)}
                        </span>
                      ) : (
                        <span className="xt-pill xt-pill-miss">
                          <Icons.AlertCircle className="w-4 h-4" aria-hidden="true" />
                          Missing
                        </span>
                      )}
                    </td>
                    <td>
                      {locked ? (
                        <span style={{ color: "var(--n)", fontSize: 13 }}>Locked</span>
                      ) : (
                        <button
                          type="button"
                          className="xt-btn xt-btn-sm"
                          aria-pressed={l.id === editingId}
                          aria-label={(l.id === editingId ? "Stop editing line: " : "Edit line: ") + l.description}
                          onClick={() => startEdit(l)}
                        >
                          <Icons.Edit className="w-4 h-4" aria-hidden="true" />
                          {l.id === editingId ? "Editing" : "Edit"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {!locked && (
          <>
            {/* Row 4 */}
            <section className="xt-glass" style={{ padding: 24 }} data-wf="b-3-0" aria-labelledby="form-h">
              <h2 className="xt-h2" id="form-h">Add or edit line</h2>
              <p className="xt-hint" style={{ marginTop: 4, marginBottom: 24 }}>
                {editingLine
                  ? "Editing the line “" + editingLine.description + "”. Choose Save line to keep your changes."
                  : "Fill this in for each expense. All fields except the receipt are needed to save a line."}
              </p>
              <form id="line-form" onSubmit={onSubmitForm} noValidate>
                <div className="xt-grid">
                  <div className="c3">
                    <label className="xt-label" htmlFor="f-date">Date</label>
                    <input id="f-date" ref={dateRef} type="date" className="xt-input" data-wf="i-3-0-0" value={form.date} onChange={(e) => setField("date", e.target.value)} aria-invalid={errors.date ? "true" : "false"} aria-describedby={errors.date ? "e-date" : undefined} />
                    {errors.date && <Err id="e-date">{errors.date}</Err>}
                  </div>
                  <div className="c3">
                    <label className="xt-label" htmlFor="f-cat">Category</label>
                    <select id="f-cat" className="xt-input" data-wf="i-3-0-1" value={form.category} onChange={(e) => setField("category", e.target.value)} aria-invalid={errors.category ? "true" : "false"} aria-describedby={errors.category ? "e-cat" : undefined}>
                      <option value="">Choose a category</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.category && <Err id="e-cat">{errors.category}</Err>}
                  </div>
                  <div className="c2">
                    <label className="xt-label" htmlFor="f-amt">Amount (GBP)</label>
                    <div className="xt-money">
                      <span aria-hidden="true">£</span>
                      <input id="f-amt" type="text" inputMode="decimal" autoComplete="off" placeholder="0.00" className="xt-input" data-wf="i-3-0-2" value={form.amount} onChange={(e) => setField("amount", e.target.value)} aria-invalid={errors.amount ? "true" : "false"} aria-describedby={errors.amount ? "e-amt" : undefined} />
                    </div>
                    {errors.amount && <Err id="e-amt">{errors.amount}</Err>}
                  </div>
                  <div className="c4">
                    <label className="xt-label" htmlFor="f-desc">Description</label>
                    <input id="f-desc" type="text" maxLength={140} placeholder="e.g. Taxi from Euston to client office" className="xt-input" data-wf="i-3-0-3" value={form.description} onChange={(e) => setField("description", e.target.value)} aria-invalid={errors.description ? "true" : "false"} aria-describedby={errors.description ? "e-desc" : undefined} />
                    {errors.description && <Err id="e-desc">{errors.description}</Err>}
                  </div>
                  <div className="c12">
                    <label className="xt-label" htmlFor="f-file">Receipt (JPEG, PNG or PDF, max 5 MB)</label>
                    <input key={fileKey} id="f-file" type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" className="xt-input xt-file" data-wf="i-3-0-4" onChange={onFile} aria-invalid={errors.receipt ? "true" : "false"} aria-describedby={"h-file" + (errors.receipt ? " e-file" : "")} />
                    <p id="h-file" className="xt-hint">
                      {pending
                        ? "Ready to attach: " + pending.name + " (" + fmtSize(pending.size) + ")."
                        : editingLine && editingLine.receipt
                        ? "Current receipt: " + editingLine.receipt.name + ". Choose a file to replace it."
                        : "A receipt is needed on every line before you can submit, but you can add it later."}
                    </p>
                    {errors.receipt && <Err id="e-file">{errors.receipt}</Err>}
                  </div>
                </div>
              </form>
            </section>

            <div role="status" aria-live="polite" style={{ minHeight: 24, color: "var(--p)", fontWeight: 600, fontSize: 14 }}>
              {notice && (
                <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                  <Icons.CheckCircle className="w-4 h-4" aria-hidden="true" />
                  {notice}
                </span>
              )}
            </div>

            {/* Row 5 */}
            <div className="xt-grid" style={{ alignItems: "end" }}>
              <div className="c3">
                <button type={editingId ? "button" : "submit"} form="line-form" className="xt-btn xt-btn-main" data-wf="b-4-0" disabled={!!editingId}>
                  <Icons.Plus className="w-4 h-4" aria-hidden="true" />
                  Add line
                </button>
              </div>
              <div className="c3">
                <button type={editingId ? "submit" : "button"} form="line-form" className="xt-btn" data-wf="b-4-1" disabled={!editingId}>
                  Save line
                </button>
              </div>
              <div className="c3">
                <button type="button" className="xt-btn xt-btn-warn" data-wf="b-4-2" disabled={!editingId} onClick={removeLine}>
                  Remove line
                </button>
              </div>
              <div className="c3" data-wf="b-4-3" style={{ textAlign: "right" }}>
                <span className="xt-total-label">Total: </span>
                <span className="xt-total" aria-label={"Total " + fmtGBP(total)}>{fmtGBP(total)}</span>
              </div>
            </div>
            {errors.remove && (
              <div style={{ marginTop: -8 }}><Err id="e-remove">{errors.remove}</Err></div>
            )}
            {!editingId && lines.length > 0 && (
              <p className="xt-hint" style={{ marginTop: -8 }}>Save line and Remove line become available when you choose Edit on a line in the table.</p>
            )}

            {problems.length > 0 && (
              <div ref={problemsRef} tabIndex={-1} role="alert" className="xt-glass xt-panel">
                <h2 className="xt-h2" style={{ fontSize: 18, color: "var(--a)", display: "flex", gap: 8, alignItems: "center" }}>
                  <Icons.AlertCircle className="w-5 h-5" aria-hidden="true" />
                  This claim can't be submitted yet
                </h2>
                <ul style={{ margin: "12px 0 0", paddingLeft: 24 }}>
                  {problems.map((p) => <li key={p} style={{ marginTop: 4 }}>{p}</li>)}
                </ul>
                <p className="xt-hint">Nothing has been sent. Your claim is still a draft and everything you entered is kept.</p>
              </div>
            )}

            {/* Row 6 */}
            <div className="xt-grid" style={{ marginTop: 8 }}>
              <div className="c6">
                <button type="button" ref={deleteBtnRef} className="xt-btn xt-btn-warn" data-wf="b-5-0" onClick={() => setConfirmOpen(true)}>
                  <Icons.Trash className="w-4 h-4" aria-hidden="true" />
                  Delete draft
                </button>
              </div>
              <div className="c6">
                <button type="button" className="xt-btn xt-btn-primary" data-wf="b-5-1" onClick={submitClaim} style={{ minHeight: 60, fontSize: 17 }}>
                  Submit claim
                  <Icons.ArrowRight className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>
            <p className="xt-hint" style={{ marginTop: -8 }}>Submitting locks the claim: you won't be able to edit or delete it afterwards.</p>
          </>
        )}
      </div>

      {/* Row 7 */}
      {confirmOpen && (
        <div className="xt-overlay" data-wf="b-6-0" onKeyDown={onDialogKey} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmOpen(false); }}>
          <div className="xt-glass xt-dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-t" aria-describedby="dlg-d">
            <h2 className="xt-h2" id="dlg-t" style={{ fontSize: 26 }}>Delete this draft?</h2>
            <p id="dlg-d" style={{ margin: "12px 0 0", color: "var(--n)" }}>
              This removes the claim, its lines and receipts.
            </p>
            <p style={{ margin: "16px 0 0", fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
              EXP-0042 · {title || "Untitled claim"} · {lines.length} {lines.length === 1 ? "line" : "lines"} · {fmtGBP(total)}
            </p>
            <div style={{ display: "flex", gap: 16, marginTop: 32, flexWrap: "wrap" }}>
              <button type="button" ref={cancelRef} className="xt-btn" style={{ flex: 1 }} data-wf="i-6-0-0" onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
              <button type="button" ref={deleteRef} className="xt-btn xt-btn-primary" style={{ flex: 1 }} data-wf="i-6-0-1" onClick={() => { setConfirmOpen(false); navigate("dashboard"); }}>
                <Icons.Trash className="w-4 h-4" aria-hidden="true" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
