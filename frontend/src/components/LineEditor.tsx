import React from "react";

import { apiFetch, ApiError } from "@/lib/api";

type Line = {
  id: number;
  date: string;
  category_id: number;
  category_name: string;
  amount_gbp: string;
  description: string;
};
type Category = { id: number; name: string };
type Form = { date: string; category: string; amount: string; description: string };
type Errors = Partial<Record<keyof Form, string>>;

const FIELD_MAP: Record<string, keyof Form> = {
  date: "date",
  category_id: "category",
  amount_gbp: "amount",
  description: "description",
};
const LOCKED = "Only draft claims can be changed.";
const NOT_YOURS = "You can only change your own claims.";
const ONLY_LINE = "A claim needs at least one line. Delete the draft instead.";

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

function serverErrors(err: unknown): Errors | null {
  if (!(err instanceof ApiError) || err.status !== 422) return null;
  const out: Errors = {};
  const detail: unknown = err.detail;
  if (Array.isArray(detail)) {
    for (const d of detail as Array<{ loc?: unknown[]; msg?: string }>) {
      const key = FIELD_MAP[String(d.loc?.[d.loc.length - 1])];
      if (key) out[key] = d.msg ?? "Invalid value";
    }
  }
  return out;
}

type Props = {
  claimId: number;
  line: Line;
  lineCount: number;
  categories: Category[];
  onClaimChange: (claim: never) => void;
};

export function LineEditor({ claimId, line, lineCount, categories, onClaimChange }: Props) {
  const [editing, setEditing] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [errors, setErrors] = React.useState<Errors>({});
  const [form, setForm] = React.useState<Form>({
    date: line.date.slice(0, 10),
    category: String(line.category_id),
    amount: line.amount_gbp,
    description: line.description,
  });
  const url = `/api/claims/${claimId}/lines/${line.id}`;
  const options = categories.some((c) => c.id === line.category_id)
    ? categories
    : [...categories, { id: line.category_id, name: line.category_name }];

  function startEdit() {
    setForm({
      date: line.date.slice(0, 10),
      category: String(line.category_id),
      amount: line.amount_gbp,
      description: line.description,
    });
    setErrors({});
    setError("");
    setEditing(true);
  }

  function failure(err: unknown) {
    const status = err instanceof ApiError ? err.status : 0;
    const mapped = serverErrors(err);
    if (mapped && Object.keys(mapped).length) setErrors(mapped);
    else if (status === 409) setError(LOCKED);
    else if (status === 403 || status === 404) setError(NOT_YOURS);
    else setError("Could not save the change. Please try again.");
  }

  async function save(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");
    const e = validateLine(form);
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const claim = await apiFetch<never>(url, {
        method: "PATCH",
        body: JSON.stringify({
          date: form.date,
          category_id: Number(form.category),
          amount_gbp: form.amount.trim(),
          description: form.description.trim(),
        }),
      });
      setEditing(false);
      onClaimChange(claim);
    } catch (err) {
      failure(err);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setError("");
    setBusy(true);
    try {
      const claim = await apiFetch<never>(url, { method: "DELETE" });
      setConfirming(false);
      onClaimChange(claim);
    } catch (err) {
      setConfirming(false);
      failure(err);
    } finally {
      setBusy(false);
    }
  }

  const set = (k: keyof Form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const field = (k: keyof Form, label: string, input: React.ReactNode) => (
    <div>
      {input}
      {errors[k] && (
        <p id={`err-${line.id}-${k}`} className="xt-err">
          {errors[k]}
        </p>
      )}
      <span className="xt-sr">{label}</span>
    </div>
  );
  const common = (k: keyof Form, label: string) => ({
    "aria-label": label,
    className: "xt-input",
    value: form[k],
    "aria-invalid": errors[k] ? ("true" as const) : ("false" as const),
    "aria-describedby": errors[k] ? `err-${line.id}-${k}` : undefined,
  });

  if (editing)
    return (
      <form onSubmit={save} noValidate data-testid={`edit-form-${line.id}`}>
        {field(
          "date",
          "",
          <input
            type="date"
            {...common("date", "Edit date")}
            onChange={(e) => set("date", e.target.value)}
          />,
        )}
        {field(
          "category",
          "",
          <select
            {...common("category", "Edit category")}
            onChange={(e) => set("category", e.target.value)}
          >
            <option value="">Choose…</option>
            {options.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>,
        )}
        {field(
          "amount",
          "",
          <input
            inputMode="decimal"
            {...common("amount", "Edit amount")}
            onChange={(e) => set("amount", e.target.value)}
          />,
        )}
        {field(
          "description",
          "",
          <input
            maxLength={140}
            {...common("description", "Edit description")}
            onChange={(e) => set("description", e.target.value)}
          />,
        )}
        {error && (
          <p role="alert" className="xt-err">
            {error}
          </p>
        )}
        <button type="submit" className="xt-btn xt-btn-primary" disabled={busy}>
          Save
        </button>
        <button type="button" className="xt-btn" onClick={() => setEditing(false)}>
          Cancel edit
        </button>
      </form>
    );

  const only = lineCount <= 1;
  return (
    <div>
      {confirming ? (
        <div>
          <span>Remove this line?</span>
          <button type="button" className="xt-btn" disabled={busy} onClick={remove}>
            Confirm remove
          </button>
          <button type="button" className="xt-btn" onClick={() => setConfirming(false)}>
            Keep line
          </button>
        </div>
      ) : (
        <>
          <button type="button" className="xt-btn" onClick={startEdit}>
            Edit
          </button>
          <button
            type="button"
            className="xt-btn"
            disabled={only}
            aria-describedby={only ? `only-${line.id}` : undefined}
            onClick={() => setConfirming(true)}
          >
            Remove
          </button>
          {only && (
            <p id={`only-${line.id}`} className="xt-hint">
              {ONLY_LINE}
            </p>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="xt-err">
          {error}
        </p>
      )}
    </div>
  );
}
