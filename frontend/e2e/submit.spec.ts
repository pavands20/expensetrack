import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { adminCredentials } from "./support/admin";

const API = (process.env.E2E_API_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);
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
  const password = crypto.randomUUID();
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
  const token = await login(request, email, password);
  return { id, email, password, token };
}

async function signInUi(page: Page, email: string, password: string) {
  await page.goto("/sign-in");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/dashboard/);
}

async function adminToken(request: APIRequestContext) {
  const a = adminCredentials();
  return login(request, a.email, a.password);
}

async function draft(request: APIRequestContext, token: string, withLine: boolean) {
  const c = await (
    await request.post(`${API}/api/claims`, { headers: auth(token), data: {} })
  ).json();
  let lineId = 0;
  if (withLine) {
    const l = await request.post(`${API}/api/claims/${c.id}/lines`, {
      headers: auth(token),
      data: { date: "2026-03-04", category_id: 1, amount_gbp: "5.00", description: "Taxi" },
    });
    expect(l.status()).toBe(201);
    lineId = (await l.json()).lines[0].id;
    const u = await request.put(`${API}/api/claims/${c.id}/lines/${lineId}/receipt`, {
      headers: auth(token),
      multipart: { file: { name: "r.png", mimeType: "image/png", buffer: PNG_1PX } },
    });
    expect(u.status()).toBe(200);
  }
  return { id: c.id as number, lineId };
}

test("[AC-048] submit locks the claim in the UI and the API returns 409 on edits", async ({
  page,
  request,
}) => {
  const admin = await adminToken(request);
  const emp = await makeUser(request, admin, "Employee");
  const c = await draft(request, emp.token, true);
  await signInUi(page, emp.email, emp.password);
  await page.goto(`/claims/${c.id}`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Draft");
  await page.getByRole("button", { name: "Submit claim" }).click();
  await expect(page.getByRole("heading", { level: 1 })).not.toContainText("Draft");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Pending");
  await expect(page.getByRole("button", { name: "Submit claim" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Delete draft" })).toHaveCount(0);
  await expect(page.getByTestId("add-line")).toHaveCount(0);

  const h = { headers: auth(emp.token) };
  const post = await request.post(`${API}/api/claims/${c.id}/lines`, {
    ...h,
    data: { date: "2026-03-04", category_id: 1, amount_gbp: "5.00", description: "x" },
  });
  expect(post.status()).toBe(409);
  expect((await request.delete(`${API}/api/claims/${c.id}`, h)).status()).toBe(409);
  // PATCH on a claim: no such route exists in the contract; it must never succeed.
  const patch = await request.patch(`${API}/api/claims/${c.id}`, { ...h, data: { title: "x" } });
  expect(patch.status()).toBeGreaterThanOrEqual(400);
});

test("[AC-049] submitting a claim with no lines is refused and stays a draft", async ({
  page,
  request,
}) => {
  const admin = await adminToken(request);
  const emp = await makeUser(request, admin, "Employee");
  const c = await draft(request, emp.token, false);
  const r = await request.post(`${API}/api/claims/${c.id}/submit`, { headers: auth(emp.token) });
  expect(r.status()).toBe(422);
  const d = (await r.json()).detail;
  expect(d.message.length).toBeGreaterThan(0);
  expect(d.missing_receipt_line_ids).toEqual([]);

  await signInUi(page, emp.email, emp.password);
  await page.goto(`/claims/${c.id}`);
  await page.getByRole("button", { name: "Submit claim" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /at least one line/i })).toBeVisible();
  const got = await (
    await request.get(`${API}/api/claims/${c.id}`, { headers: auth(emp.token) })
  ).json();
  expect(got.status).toBe("draft");
});

test("[AC-050] Employee with a manager: claim is in manager queue, not Finance's", async ({
  request,
}) => {
  const admin = await adminToken(request);
  const mgr = await makeUser(request, admin, "Manager");
  const emp = await makeUser(request, admin, "Employee", mgr.id);
  const c = await draft(request, emp.token, true);
  const r = await request.post(`${API}/api/claims/${c.id}/submit`, { headers: auth(emp.token) });
  expect(r.status()).toBe(200);
  expect((await r.json()).status).toBe("pending_manager");
  const mq = await (
    await request.get(`${API}/api/approvals/queue`, { headers: auth(mgr.token) })
  ).json();
  expect(mq.map((x: { id: number }) => x.id)).toContain(c.id);
  const fin = await makeUser(request, admin, "Finance");
  const fq = await (
    await request.get(`${API}/api/approvals/queue`, { headers: auth(fin.token) })
  ).json();
  expect(fq.map((x: { id: number }) => x.id)).not.toContain(c.id);
});

test("[AC-051] no manager: Finance other than owner sees it; owner does not", async ({
  request,
}) => {
  const admin = await adminToken(request);
  const emp = await makeUser(request, admin, "Employee");
  const c = await draft(request, emp.token, true);
  const r = await request.post(`${API}/api/claims/${c.id}/submit`, { headers: auth(emp.token) });
  expect((await r.json()).status).toBe("pending_finance");
  const fin = await makeUser(request, admin, "Finance");
  const fq = await (
    await request.get(`${API}/api/approvals/queue`, { headers: auth(fin.token) })
  ).json();
  expect(fq.map((x: { id: number }) => x.id)).toContain(c.id);

  const own = await draft(request, fin.token, true);
  const s = await request.post(`${API}/api/claims/${own.id}/submit`, {
    headers: auth(fin.token),
  });
  expect((await s.json()).status).toBe("pending_finance");
  const fq2 = await (
    await request.get(`${API}/api/approvals/queue`, { headers: auth(fin.token) })
  ).json();
  expect(fq2.map((x: { id: number }) => x.id)).not.toContain(own.id);
  const other = await makeUser(request, admin, "Finance");
  const oq = await (
    await request.get(`${API}/api/approvals/queue`, { headers: auth(other.token) })
  ).json();
  expect(oq.map((x: { id: number }) => x.id)).toContain(own.id);
});

// NFR-008 (UK GDPR, eu-west-2 hosting, encryption) is infrastructure: not testable here.
