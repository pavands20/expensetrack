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
  const name = `${role} ${uid}`;
  const data: Record<string, unknown> = { name, email, role, initial_password: password };
  if (managerId !== undefined) data.manager_id = managerId;
  const r = await request.post(`${API}/api/users`, { headers: auth(admin), data });
  expect(r.status()).toBe(201);
  return {
    id: (await r.json()).id as number,
    name,
    email,
    password,
    token: await login(request, email, password),
  };
}

async function signInUi(page: Page, email: string, password: string) {
  await page.goto("/sign-in");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/dashboard/);
}

async function rejected(request: APIRequestContext, comment: string) {
  const a = adminCredentials();
  const admin = await login(request, a.email, a.password);
  const mgr = await makeUser(request, admin, "Manager");
  const emp = await makeUser(request, admin, "Employee", mgr.id);
  const c = await (
    await request.post(`${API}/api/claims`, { headers: auth(emp.token), data: {} })
  ).json();
  const l = await request.post(`${API}/api/claims/${c.id}/lines`, {
    headers: auth(emp.token),
    data: { date: "2026-03-04", category_id: 1, amount_gbp: "5.00", description: "Taxi" },
  });
  const lineId = (await l.json()).lines[0].id as number;
  const up = await request.put(`${API}/api/claims/${c.id}/lines/${lineId}/receipt`, {
    headers: auth(emp.token),
    multipart: { file: { name: "r.png", mimeType: "image/png", buffer: PNG_1PX } },
  });
  expect(up.status()).toBe(200);
  expect(
    (await request.post(`${API}/api/claims/${c.id}/submit`, { headers: auth(emp.token) })).status(),
  ).toBe(200);
  const d = await request.post(`${API}/api/claims/${c.id}/decision`, {
    headers: auth(mgr.token),
    data: { decision: "reject", comment },
  });
  expect(d.status()).toBe(200);
  return { id: c.id as number, emp, mgr };
}

test("[AC-069] rejected claim opens as an editable draft showing approver name and comment", async ({
  page,
  request,
}) => {
  const comment = `Unclear receipt ${crypto.randomUUID().slice(0, 8)}`;
  const { id, emp, mgr } = await rejected(request, comment);
  await signInUi(page, emp.email, emp.password);
  await page.goto(`/claims/${id}`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Draft");
  await expect(page.getByText(comment).first()).toBeVisible();
  await expect(page.getByText(mgr.name).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit claim" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit", exact: true }).first()).toBeVisible();
});

test("[AC-070][AC-071] resubmitting restarts approval and history keeps the rejection comment", async ({
  page,
  request,
}) => {
  const comment = `Please fix ${crypto.randomUUID().slice(0, 8)}`;
  const { id, emp, mgr } = await rejected(request, comment);
  await signInUi(page, emp.email, emp.password);
  await page.goto(`/claims/${id}`);
  await page.getByRole("button", { name: "Submit claim" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Pending");
  const got = await (
    await request.get(`${API}/api/claims/${id}`, { headers: auth(emp.token) })
  ).json();
  expect(got.status).toBe("pending_manager");
  const q = await (
    await request.get(`${API}/api/approvals/queue`, { headers: auth(mgr.token) })
  ).json();
  expect(q.map((x: { id: number }) => x.id)).toContain(id);
  await page.reload();
  await expect(page.getByTestId("history")).toContainText(comment);
});

// NFR-008 (UK GDPR, eu-west-2, encryption) is infrastructure: not testable here; role access is covered elsewhere.
