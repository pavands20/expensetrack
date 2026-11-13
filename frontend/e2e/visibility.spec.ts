import { expect, test, type APIRequestContext } from "@playwright/test";
import { adminCredentials } from "./support/admin";

const API = (process.env.E2E_API_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

async function login(request: APIRequestContext, email: string, password: string) {
  const r = await request.post(`${API}/api/auth/login`, { data: { email, password } });
  expect(r.ok()).toBeTruthy();
  return (await r.json()).token as string;
}

async function makeUser(
  request: APIRequestContext,
  admin: string,
  role: string,
  managerId?: number,
) {
  const uid = crypto.randomUUID().slice(0, 8);
  const email = `${role.toLowerCase()}-${uid}@example.com`;
  const password = `Pw-${crypto.randomUUID()}`;
  const data: Record<string, unknown> = {
    name: `${role} ${uid}`,
    email,
    role,
    initial_password: password,
  };
  if (managerId !== undefined) data.manager_id = managerId;
  const r = await request.post(`${API}/api/users`, { headers: auth(admin), data });
  expect(r.status()).toBe(201);
  const id = (await r.json()).id as number;
  return { id, token: await login(request, email, password) };
}

async function claimFor(request: APIRequestContext, token: string) {
  const r = await request.post(`${API}/api/claims`, { headers: auth(token), data: {} });
  expect(r.status()).toBe(201);
  return (await r.json()).id as number;
}

async function ids(request: APIRequestContext, token: string) {
  const r = await request.get(`${API}/api/claims`, { headers: auth(token) });
  expect(r.status()).toBe(200);
  return (await r.json()).map((c: { id: number }) => c.id) as number[];
}

async function world(request: APIRequestContext) {
  const a = adminCredentials();
  const admin = await login(request, a.email, a.password);
  const mgr = await makeUser(request, admin, "Manager");
  const rep = await makeUser(request, admin, "Employee", mgr.id);
  const other = await makeUser(request, admin, "Employee");
  const gone = await makeUser(request, admin, "Employee");
  const fin = await makeUser(request, admin, "Finance");
  const c = {
    mgr: await claimFor(request, mgr.token),
    rep: await claimFor(request, rep.token),
    other: await claimFor(request, other.token),
    gone: await claimFor(request, gone.token),
  };
  const d = await request.post(`${API}/api/users/${gone.id}/deactivate`, { headers: auth(admin) });
  expect(d.ok()).toBeTruthy();
  return { admin, mgr, rep, other, fin, c };
}

test("[AC-013] Employee sees only own claims; other's claim by ID is 404", async ({ request }) => {
  const w = await world(request);
  const list = await ids(request, w.other.token);
  expect(list).toContain(w.c.other);
  for (const k of [w.c.mgr, w.c.rep, w.c.gone]) expect(list).not.toContain(k);
  const r = await request.get(`${API}/api/claims/${w.c.rep}`, { headers: auth(w.other.token) });
  expect(r.status()).toBe(404);
});

test("[AC-014] Manager sees own and direct reports' claims only", async ({ request }) => {
  const w = await world(request);
  const list = await ids(request, w.mgr.token);
  expect(list).toContain(w.c.mgr);
  expect(list).toContain(w.c.rep);
  expect(list).not.toContain(w.c.other);
});

test("[AC-015] Finance sees all claims including a deactivated user's", async ({ request }) => {
  const w = await world(request);
  const list = await ids(request, w.fin.token);
  for (const k of Object.values(w.c)) expect(list).toContain(k);
});

test("[AC-016] Manager requesting a non-report's claim by ID gets 404", async ({ request }) => {
  const w = await world(request);
  const r = await request.get(`${API}/api/claims/${w.c.other}`, { headers: auth(w.mgr.token) });
  expect(r.status()).toBe(404);
  const ok = await request.get(`${API}/api/claims/${w.c.rep}`, { headers: auth(w.mgr.token) });
  expect(ok.status()).toBe(200);
});

test("[NFR-004] unauthenticated list is 401; Employee gets 403 on GET /api/users", async ({
  request,
}) => {
  const w = await world(request);
  expect((await request.get(`${API}/api/claims`)).status()).toBe(401);
  expect(
    (await request.get(`${API}/api/claims`, { headers: auth("invalid-token") })).status(),
  ).toBe(401);
  expect((await request.get(`${API}/api/users`, { headers: auth(w.other.token) })).status()).toBe(
    403,
  );
});

test("[NFR-008] personal data (names, emails, claims) is limited by role", async ({ request }) => {
  // Hosting region and encryption are infrastructure and not testable here; role-limited access is.
  const w = await world(request);
  expect((await request.get(`${API}/api/users`)).status()).toBe(401);
  expect((await request.get(`${API}/api/users`, { headers: auth(w.other.token) })).status()).toBe(
    403,
  );
  const r = await request.get(`${API}/api/claims/${w.c.rep}`, { headers: auth(w.other.token) });
  expect(r.status()).toBe(404);
  expect((await request.get(`${API}/api/users`, { headers: auth(w.fin.token) })).status()).toBe(
    200,
  );
});
