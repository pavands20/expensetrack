import { expect, test } from "@playwright/test";

import { adminCredentials } from "./support/admin";

const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8000";

async function login(
  request: import("@playwright/test").APIRequestContext,
  email: string,
  password: string,
) {
  return request.post(`${API}/api/auth/login`, { data: { email, password } });
}

async function adminToken(request: import("@playwright/test").APIRequestContext): Promise<string> {
  const a = adminCredentials();
  const res = await login(request, a.email, a.password);
  expect(res.status()).toBe(200);
  return (await res.json()).token;
}

test("[API-healthz] liveness endpoint answers without auth", async ({ request }) => {
  const res = await request.get(`${API}/api/healthz`);
  expect(res.status()).toBe(200);
  expect((await res.json()).status).toBeTruthy();
});

test("[API-login] valid login returns a token and the user; me resolves it", async ({
  request,
}) => {
  const a = adminCredentials();
  const res = await login(request, a.email, a.password);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(typeof body.token).toBe("string");
  expect(body.user.email.toLowerCase()).toBe(a.email.toLowerCase());
  expect(body.user.role).toBe("Finance");

  const me = await request.get(`${API}/api/auth/me`, {
    headers: { Authorization: `Bearer ${body.token}` },
  });
  expect(me.status()).toBe(200);
  expect((await me.json()).email.toLowerCase()).toBe(a.email.toLowerCase());
});

test("[API-login] unknown email and wrong password give the same generic 401", async ({
  request,
}) => {
  const a = adminCredentials();
  const wrong = await login(request, a.email, `wrong-${crypto.randomUUID()}`);
  const unknown = await login(
    request,
    `nobody-${crypto.randomUUID()}@example.com`,
    `pw-${crypto.randomUUID()}`,
  );
  expect(wrong.status()).toBe(401);
  expect(unknown.status()).toBe(401);
  expect(await unknown.json()).toEqual(await wrong.json());
});

test("[API-me] a request without a bearer token is refused with 401", async ({ request }) => {
  const res = await request.get(`${API}/api/auth/me`);
  expect(res.status()).toBe(401);
});

test("[API-logout] logout returns 204 and revokes the session", async ({ request }) => {
  const token = await adminToken(request);
  const auth = { Authorization: `Bearer ${token}` };
  const out = await request.post(`${API}/api/auth/logout`, { headers: auth });
  expect(out.status()).toBe(204);
  const me = await request.get(`${API}/api/auth/me`, { headers: auth });
  expect(me.status()).toBe(401);
});

test("[API-users] Finance creates a user; duplicate email is 409; an employee cannot list users", async ({
  request,
}) => {
  const token = await adminToken(request);
  const auth = { Authorization: `Bearer ${token}` };
  const email = `emp-${crypto.randomUUID()}@example.com`;
  const password = `Pw-${crypto.randomUUID()}`;
  const data = { name: "E2E Employee", email, role: "Employee", initial_password: password };

  const created = await request.post(`${API}/api/users`, { headers: auth, data });
  expect(created.status()).toBe(201);
  const dup = await request.post(`${API}/api/users`, { headers: auth, data });
  expect(dup.status()).toBe(409);

  const empLogin = await login(request, email, password);
  expect(empLogin.status()).toBe(200);
  const empToken = (await empLogin.json()).token;
  const list = await request.get(`${API}/api/users`, {
    headers: { Authorization: `Bearer ${empToken}` },
  });
  expect(list.status()).toBe(403);
});

test("[API-deactivate] a deactivated user's session is revoked and login is refused", async ({
  request,
}) => {
  const token = await adminToken(request);
  const auth = { Authorization: `Bearer ${token}` };
  const email = `gone-${crypto.randomUUID()}@example.com`;
  const password = `Pw-${crypto.randomUUID()}`;
  const created = await request.post(`${API}/api/users`, {
    headers: auth,
    data: { name: "E2E Leaver", email, role: "Employee", initial_password: password },
  });
  expect(created.status()).toBe(201);
  const id = (await created.json()).id;
  const userToken = (await (await login(request, email, password)).json()).token;

  const off = await request.post(`${API}/api/users/${id}/deactivate`, { headers: auth });
  expect(off.status()).toBe(200);

  const me = await request.get(`${API}/api/auth/me`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  expect(me.status()).toBe(401);
  expect((await login(request, email, password)).status()).toBe(401);
});
