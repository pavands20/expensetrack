import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { apiFetch, ApiError, setSessionToken } from "@/lib/api";
import { brand } from "@/lib/brand";

type LoginResponse = { token: string };

const glass = {
  backgroundColor: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: brand.radius,
};

export default function Screen() {
  const navigate = useNavigate();
  const location = useLocation();
  const expired = Boolean((location.state as { expired?: boolean } | null)?.expired);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setSessionToken(res.token);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status !== 401
          ? "Could not sign in. Please try again."
          : "Invalid email or password",
      );
    } finally {
      setBusy(false);
    }
  }

  const field = "h-12 w-full px-4 text-sm text-white outline-none focus:ring-2";

  return (
    <div
      className="flex min-h-screen items-center justify-center text-white"
      style={{ fontFamily: brand.fontBody }}
    >
      <main className="w-full max-w-[420px] p-10" style={glass}>
        <h1 className="text-3xl font-extrabold" style={{ fontFamily: brand.fontHeading }}>
          Sign in to ExpenseTrack
        </h1>
        {expired && (
          <p role="status" data-testid="session-notice" className="mt-4 text-sm font-semibold">
            Please sign in again
          </p>
        )}
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label htmlFor="email" className="block text-sm">
            Email
          </label>
          <input
            id="email"
            data-testid="email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={field}
            style={glass}
          />
          <label htmlFor="password" className="block text-sm">
            Password
          </label>
          <input
            id="password"
            data-testid="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
            style={glass}
          />
          {error && (
            <p role="alert" data-testid="error" className="text-sm font-semibold">
              {error}
            </p>
          )}
          <button
            type="submit"
            data-testid="submit"
            disabled={busy}
            className="h-12 w-full text-sm font-bold text-white disabled:opacity-50"
            style={{
              background: `linear-gradient(90deg, ${brand.primaryColor}, ${brand.accentColor})`,
              borderRadius: brand.radius,
            }}
          >
            Sign in
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link to="/reset-password" className="font-semibold underline">
            Forgot your password?
          </Link>
        </p>
        <p className="mt-6 text-center text-sm text-white/60">Accounts are created by Finance.</p>
      </main>
    </div>
  );
}
