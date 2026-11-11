import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { apiFetch, ApiError } from "@/lib/api";
import { brand } from "@/lib/brand";
import { Icons } from "@/lib/icons";
import { ReceiptControl } from "@/components/ReceiptControl";
import { SubmitClaim } from "@/components/SubmitClaim";

type Line = {
  id: number;
  date: string;
  category_id: number;
  category_name: string;
  category_is_active: boolean;
  amount_gbp: string;
  description: string;
  has_receipt?: boolean;
};
type ClaimData = {
  id: number;
  reference: string;
  title: string | null;
  status: string;
  owner_id: number;
  owner_name: string;
  created_at: string;
  lines: Line[];
  total_gbp: string;
};
type Category = { id: number; name: string; limit_gbp: string | null; is_active: boolean };
type Form = { date: string; category: string; amount: string; description: string };
type Errors = Partial<Record<keyof Form, string>>;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const EMPTY_FORM: Form = { date: "", category: "", amount: "", description: "" };
const FIELD_MAP: Record<string, keyof Form> = {
  date: "date",
  category_id: "category",
  amount_gbp: "amount",
  description: "description",
};

function fmtDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return Number(d) + " " + MONTHS[Number(m) - 1] + " " + y;
}
const gbp = (v: string) => "£" + v;

function validateLine(f: Form): Errors {
  const e: Errors = {};
  if (!f.date) e.date = "Pick the date you spent the money.";
  if (!f.category) e.category = "Choose a category.";
  const amt = f.amount.trim();
  if (!amt) e.amount = "Enter the amount in pounds.";
  else if (!/^\d+(\.\d{1,2})?$/.test(amt))
    e.amount = "Use pounds and pence, like 12.50: a positive number with at most two decimals.";
  else if (Number(amt) <= 0) e.amount = "The amount must be more than £0.00.";
  if (!f.description.trim())
    e.description = "Add a short description so your approver knows what this was.";
  return e;
}

// Maps FastAPI 422 detail[].loc[-1] onto form fields.
function serverErrors(err: unknown): Errors | null {
  if (!(err instanceof ApiError) || err.status !== 422) return null;
  const detail: unknown = err.detail;
  const out: Errors = {};
  if (Array.isArray(detail)) {
    for (const d of detail as Array<{ loc?: unknown[]; msg?: string }>) {
      const key = FIELD_MAP[String(d.loc?.[d.loc.length - 1])];
      if (key) out[key] = d.msg ?? "Invalid value";
    }
  }
  return out;
}

export default function Screen() {
  const navigate = useNavigate();
  const params = useParams();
  const routeId = params.id;
  const [claim, setClaim] = React.useState<ClaimData | null>(null);
  const [loading, setLoading] = React.useState(Boolean(routeId));
  const [notFound, setNotFound] = React.useState(false);
  const [loadError, setLoadError] = React.useState("");
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [form, setForm] = React.useState<Form>(EMPTY_FORM);
  const [errors, setErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState("");
  const [missing, setMissing] = React.useState<number[]>([]);

  const dateRef = React.useRef<HTMLInputElement>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const deleteRef = React.useRef<HTMLButtonElement>(null);
  const deleteBtnRef = React.useRef<HTMLButtonElement>(null);
  const wasOpen = React.useRef(false);

  React.useEffect(() => {
    let live = true;
    apiFetch<Category[]>("/api/categories")
      .then((c) => live && setCategories(c.filter((x) => x.is_active)))
      .catch(() => live && setFormError("Could not load categories."));
    return () => {
      live = false;
    };
  }, []);

  React.useEffect(() => {
    if (!routeId) return;
    let live = true;
    apiFetch<ClaimData>(`/api/claims/${routeId}`)
      .then((c) => live && setClaim(c))
      .catch((e) => {
        if (!live) return;
        if (e instanceof ApiError && e.status === 404) setNotFound(true);
        else setLoadError("Could not load this claim.");
      })
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [routeId]);

  React.useEffect(() => {
    if (confirmOpen) {
      wasOpen.current = true;
      cancelRef.current?.focus();
    } else if (wasOpen.current) {
      wasOpen.current = false;
      deleteBtnRef.current?.focus();
    }
  }, [confirmOpen]);

  const locked = claim !== null && claim.status !== "draft";
  const statusLabel = claim
    ? claim.status.charAt(0).toUpperCase() + claim.status.slice(1).replace(/_/g, " ")
    : "Draft";
  const lines = claim?.lines ?? [];

  function setField(k: keyof Form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  }

  async function onSubmitForm(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validateLine(form);
    setFormError("");
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      let current = claim;
      if (!current)
        current = await apiFetch<ClaimData>("/api/claims", {
          method: "POST",
          body: JSON.stringify({}),
        });
      const saved = await apiFetch<ClaimData>(`/api/claims/${current.id}/lines`, {
        method: "POST",
        body: JSON.stringify({
          date: form.date,
          category_id: Number(form.category),
          amount_gbp: form.amount.trim(),
          description: form.description.trim(),
        }),
      });
      setClaim(saved);
      setForm(EMPTY_FORM);
      setNotice("Line added. The total is now " + gbp(saved.total_gbp) + ".");
      if (!routeId) navigate(`/claims/${saved.id}`, { replace: true });
      else dateRef.current?.focus();
    } catch (err) {
      const mapped = serverErrors(err);
      if (mapped && Object.keys(mapped).length) setErrors(mapped);
      else if (err instanceof ApiError && err.status === 409)
        setFormError("Only draft claims can be changed.");
      else if (err instanceof ApiError && err.status === 403)
        setFormError("You can only change your own claims.");
      else setFormError("Could not save the line. Please try again.");
      // A claim created before the failing line call is kept, so a retry does not duplicate it.
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    setConfirmOpen(false);
    if (!claim) {
      navigate("/dashboard");
      return;
    }
    try {
      await apiFetch<void>(`/api/claims/${claim.id}`, { method: "DELETE" });
      navigate("/dashboard");
    } catch (err) {
      setDeleteError(
        err instanceof ApiError && err.status === 409
          ? "Only draft claims can be deleted"
          : "Could not delete the claim. Please try again.",
      );
    }
  }

  function onDialogKey(ev: React.KeyboardEvent) {
    if (ev.key === "Escape") {
      ev.preventDefault();
      setConfirmOpen(false);
    } else if (ev.key === "Tab") {
      const first = cancelRef.current;
      const last = deleteRef.current;
      if (ev.shiftKey && document.activeElement === first) {
        ev.preventDefault();
        last?.focus();
      } else if (!ev.shiftKey && document.activeElement === last) {
        ev.preventDefault();
        first?.focus();
      }
    }
  }

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
  .xt-input:focus-visible,.xt-btn:focus-visible{outline:3px solid var(--p);outline-offset:2px}
  .xt-input[aria-invalid="true"]{border-color:var(--a)}
  select.xt-input option{background:var(--bg);color:var(--ink)}
  .xt-money{position:relative}.xt-money span{position:absolute;left:16px;top:50%;transform:translateY(-50%);color:var(--n);pointer-events:none}
  .xt-money .xt-input{padding-left:32px;font-variant-numeric:tabular-nums}
  .xt-err{display:flex;gap:8px;align-items:flex-start;margin:8px 0 0;font-size:13px;color:var(--a);font-weight:600}
  .xt-hint{margin:8px 0 0;font-size:13px;color:var(--n)}
  .xt-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:52px;padding:0 20px;border-radius:var(--r);font:inherit;font-weight:700;cursor:pointer;border:1px solid rgb(255 255 255 / .22);background:rgb(255 255 255 / .07);color:var(--ink);transition:transform .15s,box-shadow .2s,background .2s,border-color .2s}
  .xt-btn:hover:not(:disabled){background:rgb(255 255 255 / .13);border-color:rgb(255 255 255 / .4);transform:translateY(-1px)}
  .xt-btn:disabled{opacity:.42;cursor:not-allowed}
  .xt-btn-primary{border:0;color:var(--bg);background:linear-gradient(100deg,var(--p),var(--a));box-shadow:0 12px 56px -8px color-mix(in srgb,var(--a) 65%,transparent)}
  .xt-btn-warn{border-color:color-mix(in srgb,var(--a) 60%,transparent);color:var(--a)}
  .xt-table-wrap{overflow-x:auto}
  .xt-table{width:100%;border-collapse:collapse;min-width:560px;font-variant-numeric:tabular-nums}
  .xt-table th{text-align:left;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--n);padding:12px 16px;border-bottom:1px solid var(--hair);white-space:nowrap}
  .xt-table td{padding:16px;border-bottom:1px solid rgb(255 255 255 / .09);vertical-align:middle}
  .xt-table tbody tr:last-child td{border-bottom:0}
  .xt-table .num{text-align:right}
  .xt-cat{display:inline-block;padding:2px 12px;border-radius:999px;font-size:13px;font-weight:600;border:1px solid rgb(255 255 255 / .22)}
  .xt-total{font-size:44px;line-height:1;font-weight:800;letter-spacing:-0.02em;font-variant-numeric:tabular-nums;background:linear-gradient(100deg,var(--p),var(--a));-webkit-background-clip:text;background-clip:text;color:transparent}
  .xt-total-label{display:block;font-size:13px;font-weight:600;letter-spacing:.02em;color:var(--n);margin-bottom:4px}
  .xt-overlay{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:16px;background:color-mix(in srgb,var(--bg) 78%,transparent);backdrop-filter:blur(6px)}
  .xt-dialog{width:100%;max-width:480px;padding:32px;background:color-mix(in srgb,var(--bg) 86%,white);box-shadow:0 40px 120px -10px rgb(0 0 0 / .75),0 0 80px -20px var(--a)}
  .xt-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
  @media (prefers-reduced-motion:reduce){.xt-root *{animation:none !important;transition:none !important}}
  `;

  const Err = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <p id={id} className="xt-err">
      <Icons.AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );

  if (loading)
    return (
      <p role="status" className="p-6">
        Loading…
      </p>
    );
  if (notFound)
    return (
      <div className="xt-root">
        <style>{css}</style>
        <div className="xt-wrap">
          <h1 className="xt-h1" role="alert">
            Claim not found
          </h1>
          <button type="button" className="xt-btn" onClick={() => navigate("/dashboard")}>
            Back to my claims
          </button>
        </div>
      </div>
    );
  if (loadError)
    return (
      <p role="alert" className="p-6">
        {loadError}
      </p>
    );

  return (
    <div className="xt-root">
      <style>{css}</style>
      <div className="xt-wrap">
        <div className="xt-grid">
          <div className="c9">
            <h1 className="xt-h1">
              {claim ? "Claim " + claim.reference : "New claim"} — {statusLabel}
            </h1>
            <p className="xt-meta">
              {claim
                ? `Owner: ${claim.owner_name} · Started ${fmtDate(claim.created_at)}`
                : "Add your first line to start this claim."}
              {locked && " · Submitted and locked. It can't be edited or deleted."}
            </p>
          </div>
          <div className="c3">
            <button type="button" className="xt-btn" onClick={() => navigate("/dashboard")}>
              <Icons.ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Back to my claims
            </button>
          </div>
        </div>

        <div role="status" className="xt-sr">
          {notice}
        </div>

        <section className="xt-glass" style={{ padding: 24 }} aria-labelledby="lines-h">
          <h2 className="xt-h2" id="lines-h" style={{ marginBottom: 16 }}>
            Claim lines
          </h2>
          <div className="xt-table-wrap">
            <table className="xt-table" aria-labelledby="lines-h">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Category</th>
                  <th scope="col" className="num">
                    Amount (GBP)
                  </th>
                  <th scope="col">Description</th>
                  <th scope="col">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: "48px 16px", textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                        No lines on this claim yet
                      </p>
                    </td>
                  </tr>
                )}
                {lines.map((l) => (
                  <tr key={l.id} data-testid={`line-${l.id}`}>
                    <td style={{ whiteSpace: "nowrap" }}>{fmtDate(l.date)}</td>
                    <td>
                      <span className="xt-cat">{l.category_name}</span>
                    </td>
                    <td className="num" style={{ fontWeight: 700 }}>
                      {gbp(l.amount_gbp)}
                    </td>
                    <td style={{ maxWidth: 280 }}>{l.description}</td>
                    <td>
                      {missing.includes(l.id) && <strong>Receipt missing</strong>}
                      <ReceiptControl
                        claimId={claim!.id}
                        lineId={l.id}
                        hasReceipt={Boolean(l.has_receipt)}
                        locked={locked}
                        onUpdated={(c) => setClaim(c as ClaimData)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 16, textAlign: "right" }}>
            <span className="xt-total-label">Total</span>
            <span className="xt-total" data-testid="total">
              {gbp(claim?.total_gbp ?? "0.00")}
            </span>
          </div>
        </section>

        {!locked && (
          <>
            <section className="xt-glass" style={{ padding: 24 }} aria-labelledby="form-h">
              <h2 className="xt-h2" id="form-h" style={{ marginBottom: 24 }}>
                Add line
              </h2>
              <form onSubmit={onSubmitForm} noValidate>
                <div className="xt-grid">
                  <div className="c3">
                    <label className="xt-label" htmlFor="line-date">
                      Date
                    </label>
                    <input
                      id="line-date"
                      ref={dateRef}
                      type="date"
                      className="xt-input"
                      value={form.date}
                      aria-invalid={errors.date ? "true" : "false"}
                      aria-describedby={errors.date ? "err-date" : undefined}
                      onChange={(e) => setField("date", e.target.value)}
                    />
                    {errors.date && <Err id="err-date">{errors.date}</Err>}
                  </div>
                  <div className="c3">
                    <label className="xt-label" htmlFor="line-category">
                      Category
                    </label>
                    <select
                      id="line-category"
                      className="xt-input"
                      value={form.category}
                      aria-invalid={errors.category ? "true" : "false"}
                      aria-describedby={errors.category ? "err-category" : undefined}
                      onChange={(e) => setField("category", e.target.value)}
                    >
                      <option value="">Choose…</option>
                      <option value="" hidden aria-hidden="true"></option>
                      {categories.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {errors.category && <Err id="err-category">{errors.category}</Err>}
                  </div>
                  <div className="c3">
                    <label className="xt-label" htmlFor="line-amount">
                      Amount (GBP)
                    </label>
                    <div className="xt-money">
                      <span aria-hidden="true">£</span>
                      <input
                        id="line-amount"
                        className="xt-input"
                        inputMode="decimal"
                        value={form.amount}
                        aria-invalid={errors.amount ? "true" : "false"}
                        aria-describedby={errors.amount ? "err-amount" : undefined}
                        onChange={(e) => setField("amount", e.target.value)}
                      />
                    </div>
                    {errors.amount && <Err id="err-amount">{errors.amount}</Err>}
                  </div>
                  <div className="c3">
                    <label className="xt-label" htmlFor="line-description">
                      Description
                    </label>
                    <input
                      id="line-description"
                      className="xt-input"
                      maxLength={140}
                      value={form.description}
                      aria-invalid={errors.description ? "true" : "false"}
                      aria-describedby={errors.description ? "err-description" : undefined}
                      onChange={(e) => setField("description", e.target.value)}
                    />
                    {errors.description && <Err id="err-description">{errors.description}</Err>}
                  </div>
                </div>
                {formError && (
                  <p role="alert" className="xt-err">
                    {formError}
                  </p>
                )}
                <div style={{ marginTop: 16, maxWidth: 240 }}>
                  <button
                    type="submit"
                    className="xt-btn xt-btn-primary"
                    data-testid="add-line"
                    disabled={busy}
                  >
                    <Icons.Plus className="w-4 h-4" aria-hidden="true" />
                    Add line
                  </button>
                </div>
              </form>
            </section>

            {deleteError && (
              <p role="alert" className="xt-err" data-testid="delete-error">
                {deleteError}
              </p>
            )}

            <div className="xt-grid">
              <div className="c6">
                <button
                  type="button"
                  ref={deleteBtnRef}
                  className="xt-btn xt-btn-warn"
                  onClick={() => {
                    setDeleteError("");
                    setConfirmOpen(true);
                  }}
                >
                  <Icons.Trash className="w-4 h-4" aria-hidden="true" />
                  Delete draft
                </button>
              </div>
              <div className="c6">
                <SubmitClaim claim={claim} onSubmitted={setClaim} onMissing={setMissing} />
              </div>
            </div>
          </>
        )}
      </div>

      {confirmOpen && (
        <div
          className="xt-overlay"
          onKeyDown={onDialogKey}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setConfirmOpen(false);
          }}
        >
          <div
            className="xt-glass xt-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dlg-t"
            aria-describedby="dlg-d"
          >
            <h2 className="xt-h2" id="dlg-t" style={{ fontSize: 26 }}>
              Delete this draft?
            </h2>
            <p id="dlg-d" style={{ margin: "12px 0 0", color: "var(--n)" }}>
              This removes the claim and its lines.
            </p>
            <div style={{ display: "flex", gap: 16, marginTop: 32, flexWrap: "wrap" }}>
              <button
                type="button"
                ref={cancelRef}
                className="xt-btn"
                style={{ flex: 1 }}
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                ref={deleteRef}
                className="xt-btn xt-btn-primary"
                style={{ flex: 1 }}
                onClick={confirmDelete}
              >
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
