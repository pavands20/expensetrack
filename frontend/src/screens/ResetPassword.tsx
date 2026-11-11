import React from "react";
import { Link, useSearchParams } from "react-router-dom";

import { apiFetch, ApiError, clearSessionToken } from "@/lib/api";
import { brand } from "@/lib/brand";

const glass = {
  backgroundColor: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: brand.radius,
};
const field = "h-12 w-full px-4 text-sm text-white outline-none focus:ring-2";
const button = "h-12 w-full text-sm font-bold text-white disabled:opacity-50";
const buttonStyle = {
  background: `linear-gradient(90deg, ${brand.primaryColor}, ${brand.accentColor})`,
  borderRadius: brand.radius,
};

function RequestForm() {
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await apiFetch<{ message: string }>("/api/auth/password-reset/request", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setMessage(res.message);
    } catch {
      setMessage("If that email belongs to an account, a reset link has been sent.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <label htmlFor="reset-email" className="block text-sm">
        Email
      </label>
      <input
        id="reset-email"
        data-testid="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={field}
        style={glass}
      />
      {message && (
        <p role="status" data-testid="message" className="text-sm font-semibold">
          {message}
        </p>
      )}
      <button
        type="submit"
        data-testid="submit"
        disabled={busy}
        className={button}
        style={buttonStyle}
      >
        Send reset link
      </button>
    </form>
  );
}

function ConfirmForm({ token }: { token: string }) {
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState("");
  const [detail, setDetail] = React.useState("");
  const [done, setDone] = React.useState(false);
  const [expired, setExpired] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setExpired(false);
    setDetail("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      await apiFetch<void>("/api/auth/password-reset/confirm", {
        method: "POST",
        body: JSON.stringify({ token, new_password: password }),
      });
      clearSessionToken();
      setDone(true);
    } catch (err) {
      const used = err instanceof ApiError && err.status === 400;
      setExpired(used);
      setError(
        used
          ? "This reset link has already been used or has expired. Request a new one."
          : "Could not reset your password. Please try again.",
      );
      setDetail(used ? err.detail : "");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mt-6 space-y-4">
        <p role="status" data-testid="message" className="text-sm font-semibold">
          Your password has been reset.
        </p>
        <Link to="/sign-in" className="font-semibold underline">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <label htmlFor="new-password" className="block text-sm">
        New password
      </label>
      <input
        id="new-password"
        data-testid="password"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={field}
        style={glass}
      />
      <label htmlFor="confirm-password" className="block text-sm">
        Confirm password
      </label>
      <input
        id="confirm-password"
        data-testid="confirm"
        type="password"
        required
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className={field}
        style={glass}
      />
      {error && (
        <p role="alert" data-testid="error" className="text-sm font-semibold">
          {error}
          {detail && <span className="block">{detail}</span>}
        </p>
      )}
      {expired && (
        <Link to="/reset-password" className="block text-sm font-semibold underline">
          Request a new link
        </Link>
      )}
      <button
        type="submit"
        data-testid="submit"
        disabled={busy}
        className={button}
        style={buttonStyle}
      >
        Set new password
      </button>
    </form>
  );
}

export default function Screen() {
  const [params] = useSearchParams();
  const token = params.get("token");
  return (
    <div
      className="flex min-h-screen items-center justify-center text-white"
      style={{ fontFamily: brand.fontBody }}
    >
      <main className="w-full max-w-[420px] p-10" style={glass}>
        <h1 className="text-3xl font-extrabold" style={{ fontFamily: brand.fontHeading }}>
          Reset your password
        </h1>
        {token ? <ConfirmForm token={token} /> : <RequestForm />}
        <p className="mt-6 text-center text-sm">
          <Link to="/sign-in" className="underline">
            Back to sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
