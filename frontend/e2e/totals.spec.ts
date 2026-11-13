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

async function signInUi(page: Page, email: string, password: string) {
  await page.goto("/sign-in");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/dashboard/);
}

async function makeUser(request: APIRequestContext, admin: string, role: string) {
  const uid = crypto.randomUUID().slice(0, 8);
  const email = `${role.toLowerCase()}-${uid}@example.com`;
  const password = crypto.randomUUID();
  const r = await request.post(`${API}/api/users`, {
    headers: auth(admin),
    data: { name: `${role} ${uid}`, email, role, initial_password: password },
  });
  expect(r.status()).toBe(201);
  return { email, password, token: await login(request, email, password) };
}

test("[AC-084] Finance opens Totals from the nav and sees per-category per-month GBP totals", async ({
  page,
  request,
}) => {
  const a = adminCredentials();
  const admin = await login(request, a.email, a.password);
  const emp = await makeUser(request, admin, "Employee");
  const catName = `Tot ${crypto.randomUUID().slice(0, 8)}`;
  const cr = await request.post(`${API}/api/categories`, {
    headers: auth(admin),
    data: { name: catName },
  });
  expect(cr.status()).toBe(201);
  const cat = (await cr.json()).id as number;
  const c = await (
    await request.post(`${API}/api/claims`, { headers: auth(emp.token), data: {} })
  ).json();
  const l = await request.post(`${API}/api/claims/${c.id}/lines`, {
    headers: auth(emp.token),
    data: { date: "2026-03-04", category_id: cat, amount_gbp: "12.34", description: "x" },
  });
  expect(l.status()).toBe(201);
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
    headers: auth(admin),
    data: { decision: "approve" },
  });
  expect(d.status()).toBe(200);

  await signInUi(page, a.email, a.password);
  await page.getByRole("link", { name: "Totals" }).click();
  await expect(page).toHaveURL(/admin\/totals/);
  const row = page.locator("tr", { hasText: catName });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText(new Date().toISOString().slice(0, 7));
  await expect(row).toContainText("£12.34");
});

test("[AC-086][NFR-004] Employee has no Totals link and sees access denied on /admin/totals", async ({
  page,
  request,
}) => {
  const a = adminCredentials();
  const admin = await login(request, a.email, a.password);
  const emp = await makeUser(request, admin, "Employee");
  expect(
    (await request.get(`${API}/api/reports/totals`, { headers: auth(emp.token) })).status(),
  ).toBe(403);
  await signInUi(page, emp.email, emp.password);
  await expect(page.getByRole("link", { name: "Totals" })).toHaveCount(0);
  await page.goto("/admin/totals");
  await expect(page.getByText("Access denied").first()).toBeVisible();
});

// NFR-008 (UK GDPR, eu-west-2, encryption) is infrastructure: only the no-personal-data
// response check is automated (pytest).
