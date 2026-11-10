// @ts-nocheck -- generated from the approved design under its JS runtime contract; not hand-written TypeScript.
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";

import { brand } from "@/lib/brand";
import { useNavigate } from "@/lib/navigate";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch, setSessionToken, ApiError } from "@/lib/api";

const PRODUCT = "ExpenseTrack";
const SCREEN = "Sign in";
const mix = (colour, percent) => `color-mix(in srgb, ${colour} ${percent}%, transparent)`;

export default function Screen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [status, setStatus] = React.useState("");
  const glass = {
    backgroundColor: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: brand.radius,
  };
  const glow = `0 20px 60px -10px ${mix(brand.primaryColor, 70)}`;

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden text-white"
      style={{ fontFamily: brand.fontBody }}
    >
      <div
        aria-hidden
        className="absolute -left-32 top-[-120px] h-[520px] w-[520px] rounded-full blur-[120px]"
        style={{ backgroundColor: mix(brand.primaryColor, 70) }}
      />
      <div
        aria-hidden
        className="absolute bottom-[-160px] right-[-80px] h-[560px] w-[560px] rounded-full blur-[130px]"
        style={{ backgroundColor: mix(brand.accentColor, 60) }}
      />
      <p
        className="absolute left-10 top-8 text-lg font-bold"
        style={{ fontFamily: brand.fontHeading }}
      >
        {PRODUCT}
      </p>

      <main
        className="relative w-full max-w-[420px] p-10 backdrop-blur-2xl"
        style={{ ...glass, boxShadow: "0 40px 120px -20px rgba(0,0,0,0.6)" }}
      >
        <p
          className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: mix(brand.accentColor, 25), color: "#fff" }}
        >
          ● Live
        </p>
        <h1
          data-wf="b-0-0"
          className="mt-5 text-4xl font-extrabold tracking-tight"
          style={{ fontFamily: brand.fontHeading }}
        >
          Sign in to ExpenseTrack
        </h1>
        <p className="mt-2 text-sm text-white/65">Jump back in where you left off.</p>
        {status ? (
          <p
            role="status"
            className="mt-8 p-4 text-sm font-semibold"
            style={{ ...glass, boxShadow: glow }}
          >
            {status}
          </p>
        ) : (
          <form
            className="mt-8 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              try {
                const res = await apiFetch("/api/auth/login", {
                  method: "POST",
                  body: JSON.stringify({ email, password }),
                });
                queryClient.clear();
                setSessionToken(res.token);
                navigate("dashboard");
              } catch (err) {
                setError(
                  err instanceof ApiError && err.status === 401
                    ? "Invalid email or password"
                    : "Could not sign in. Please try again.",
                );
              }
            }}
          >
            <label htmlFor="tech-email" className="sr-only">
              Email
            </label>
            <input
              id="tech-email"
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full px-4 text-sm text-white placeholder:text-white/40 outline-none focus:ring-2"
              style={glass}
            />
            <label htmlFor="tech-password" className="sr-only">
              Password
            </label>
            <input
              id="tech-password"
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full px-4 text-sm text-white placeholder:text-white/40 outline-none focus:ring-2"
              style={glass}
            />
            {error && (
              <p role="alert" className="text-sm font-semibold" style={{ color: brand.accentColor }}>
                {error}
              </p>
            )}
            <button
              data-wf="b-2-0"
              type="submit"
              className="h-12 w-full text-sm font-bold text-white transition-transform hover:scale-[1.02]"
              style={{
                background: `linear-gradient(90deg, ${brand.primaryColor}, ${brand.accentColor})`,
                borderRadius: brand.radius,
                boxShadow: glow,
              }}
            >
              Sign in →
            </button>
          </form>
        )}
        <div data-wf="b-3-0" className="mt-4 text-center">
          <button
            type="button"
            onClick={() => navigate("help")}
            className="text-sm font-semibold underline underline-offset-4 outline-none focus-visible:ring-2"
            style={{ color: brand.primaryColor, borderRadius: 8 }}
          >
            Forgot your password?
          </button>
        </div>
      </main>
    </div>
  );
}
