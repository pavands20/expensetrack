import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  API_SECRET_KEY,
  ApiError,
  apiFetch,
  clearSessionToken,
  getSessionToken,
  setSessionToken,
  setUnauthorizedHandler,
} from "./api";

type Call = { url: string; init: RequestInit };
const calls: Call[] = [];

function reply(status: number, body?: unknown, asJson = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => {
          if (!asJson) throw new SyntaxError("not json");
          return body;
        },
      } as Response;
    }),
  );
}

const headers = () => calls[0].init.headers as Record<string, string>;

describe("session token helpers", () => {
  it("stores, reads and clears the token in sessionStorage", () => {
    expect(getSessionToken()).toBeNull();
    setSessionToken("tok-1");
    expect(getSessionToken()).toBe("tok-1");
    expect(sessionStorage.getItem("session_token")).toBe("tok-1");
    clearSessionToken();
    expect(getSessionToken()).toBeNull();
  });

  it("does not throw when storage is unavailable", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(getSessionToken()).toBeNull();
    spy.mockRestore();
  });
});

describe("apiFetch", () => {
  beforeEach(() => {
    calls.length = 0;
    setUnauthorizedHandler(null);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    setUnauthorizedHandler(null);
  });

  it("sends the session token as the bearer, ahead of the shared secret", async () => {
    reply(200, { ok: true });
    setSessionToken("session-abc");
    await apiFetch("/api/auth/me");
    expect(headers().Authorization).toBe("Bearer session-abc");
    expect(headers()["Content-Type"]).toBe("application/json");
  });

  it("falls back to the shared secret when signed out", async () => {
    reply(200, {});
    await apiFetch("/api/categories");
    if (API_SECRET_KEY) expect(headers().Authorization).toBe(`Bearer ${API_SECRET_KEY}`);
    else expect(headers().Authorization).toBeUndefined();
  });

  it("joins base and path with exactly one slash", async () => {
    reply(200, {});
    await apiFetch("/api/auth/me");
    expect(calls[0].url).toMatch(/\/api\/auth\/me$/);
    expect(calls[0].url.replace(/^https?:\/\//, "")).not.toContain("//");
  });

  it("leaves Content-Type to the browser for FormData uploads", async () => {
    reply(200, {});
    const body = new FormData();
    body.append("file", new Blob(["x"]), "r.png");
    await apiFetch("/api/claims/1/lines/1/receipt", { method: "PUT", body });
    expect(headers()["Content-Type"]).toBeUndefined();
  });

  it("returns undefined for a 204 without reading a body", async () => {
    reply(204);
    await expect(apiFetch<void>("/api/auth/logout", { method: "POST" })).resolves.toBeUndefined();
  });

  it("throws an ApiError carrying the status and a string detail as the message", async () => {
    reply(409, { detail: "A category with that name already exists" });
    const err = await apiFetch<never>("/api/categories", { method: "POST" }).catch(
      (e: unknown) => e as ApiError,
    );
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(409);
    expect(err.message).toBe("A category with that name already exists");
  });

  it("keeps structured validation detail but shows a safe string message", async () => {
    const detail = [{ loc: ["body", "amount_gbp"], msg: "bad", type: "x" }];
    reply(422, { detail });
    const err = await apiFetch<never>("/api/claims/1/lines", { method: "POST" }).catch(
      (e: unknown) => e as ApiError,
    );
    expect(err.status).toBe(422);
    expect(err.detail).toEqual(detail);
    expect(err.message).toBe("Request failed: 422");
  });

  it("uses a generic message when the error body is not JSON", async () => {
    reply(500, undefined, false);
    const err = await apiFetch<never>("/api/claims").catch((e: unknown) => e as ApiError);
    expect(err.status).toBe(500);
    expect(err.message).toContain("500");
  });

  it("on a 401 from a protected path clears the token and calls the handler", async () => {
    reply(401, { detail: "Not authenticated" });
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    setSessionToken("stale");
    await expect(apiFetch("/api/auth/me")).rejects.toBeInstanceOf(ApiError);
    expect(getSessionToken()).toBeNull();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not treat a 401 from login or password reset as an expired session", async () => {
    reply(401, { detail: "Invalid email or password" });
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    setSessionToken("keep-me");
    await expect(apiFetch("/api/auth/login", { method: "POST" })).rejects.toBeInstanceOf(ApiError);
    await expect(
      apiFetch("/api/auth/password-reset/confirm", { method: "POST" }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(handler).not.toHaveBeenCalled();
    expect(getSessionToken()).toBe("keep-me");
  });
});
