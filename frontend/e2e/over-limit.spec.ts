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
  return { id, email, password, token: await login(request, email, password) };
}

async function signInUi(page: Page, email: string, password: string) {
  await page.goto("/sign-in");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/dashboard/);
}

async function makeCategory(request: APIRequestContext, admin: string, limit: string | null) {
  const r = await request.post(`${API}/api/categories`, {
    headers: auth(admin),
    data: { name: `Cat ${crypto.randomUUID().slice(0, 8)}` },
  });
  expect(r.status()).toBe(201);
  const cat = (await r.json()) as { id: number };
  if (limit) {
    const p = await request.patch(`${API}/api/categories/${cat.id}`, {
      headers: auth(admin),
      data: { limit_gbp: limit },
    });
    expect(p.ok()).toBeTruthy();
  }
  return cat.id;
}

async function claimWith(
  request: APIRequestContext,
  token: string,
  lines: Array<{ category: number; amount: string }>,
) {
  const c = await (
    await request.post(`${API}/api/claims`, { headers: auth(token), data: {} })
  ).json();
  for (const [i, l] of lines.entries()) {
    const r = await request.post(`${API}/api/claims/${c.id}/lines`, {
      headers: auth(token),
      data: {
        date: "2026-03-04",
        category_id: l.category,
        amount_gbp: l.amount,
        description: `Line ${i}`,
      },
    });
    expect(r.status()).toBe(201);
  }
  const got = await (
    await request.get(`${API}/api/claims/${c.id}`, { headers: auth(token) })
  ).json();
  const ids = got.lines.map((x: { id: number }) => x.id) as number[];
  for (const id of ids) {
    const u = await request.put(`${API}/api/claims/${c.id}/lines/${id}/receipt`, {
      headers: auth(token),
      multipart: { file: { name: "r.png", mimeType: "image/png", buffer: PNG_1PX } },
    });
    expect(u.status()).toBe(200);
  }
  return { id: c.id as number, lineIds: ids };
}

test("[AC-077] manager and Finance see the over-limit flag with the limit; queue marks the claim", async ({
  page,
  request,
}) => {
  const a = adminCredentials();
  const admin = await login(request, a.email, a.password);
  const cat = await makeCategory(request, admin, "50.00");
  const mgr = await makeUser(request, admin, "Manager");
  const emp = await makeUser(request, admin, "Employee", mgr.id);
  const fin = await makeUser(request, admin, "Finance");
  const c = await claimWith(request, emp.token, [{ category: cat, amount: "50.01" }]);
  const s = await request.post(`${API}/api/claims/${c.id}/submit`, { headers: auth(emp.token) });
  expect(s.status()).toBe(200);

  // Manager stage
  await signInUi(page, mgr.email, mgr.password);
  await page.goto("/approvals");
  await expect(page.getByTestId(`queue-over-limit-${c.id}`)).toBeVisible();
  await page.goto(`/claims/${c.id}`);
  const flag = page.getByTestId(`over-limit-${c.lineIds[0]}`);
  await expect(flag).toBeVisible();
  await expect(flag).toContainText("£50.00");

  const d = await request.post(`${API}/api/claims/${c.id}/decision`, {
    headers: auth(mgr.token),
    data: { decision: "approve" },
  });
  expect(d.status()).toBe(200);

  // Finance stage
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await signInUi(page, fin.email, fin.password);
  await page.goto("/approvals");
  await expect(page.getByTestId(`queue-over-limit-${c.id}`)).toBeVisible();
  await page.goto(`/claims/${c.id}`);
  const flag2 = page.getByTestId(`over-limit-${c.lineIds[0]}`);
  await expect(flag2).toBeVisible();
  await expect(flag2).toContainText("£50.00");
});

test("[AC-078] exactly £50.00 and a no-limit category show no flag", async ({ page, request }) => {
  const a = adminCredentials();
  const admin = await login(request, a.email, a.password);
  const limited = await makeCategory(request, admin, "50.00");
  const unlimited = await makeCategory(request, admin, null);
  const mgr = await makeUser(request, admin, "Manager");
  const emp = await makeUser(request, admin, "Employee", mgr.id);
  const c = await claimWith(request, emp.token, [
    { category: limited, amount: "50.00" },
    { category: unlimited, amount: "999.00" },
  ]);
  const s = await request.post(`${API}/api/claims/${c.id}/submit`, { headers: auth(emp.token) });
  expect(s.status()).toBe(200);

  await signInUi(page, mgr.email, mgr.password);
  await page.goto(`/claims/${c.id}`);
  await expect(page.getByTestId("total")).toBeVisible();
  for (const id of c.lineIds) {
    await expect(page.getByTestId(`line-${id}`)).toBeVisible();
    await expect(page.getByTestId(`over-limit-${id}`)).toHaveCount(0);
  }
  await page.goto("/approvals");
  await expect(page.getByTestId(`queue-${c.id}`)).toBeVisible();
  await expect(page.getByTestId(`queue-over-limit-${c.id}`)).toHaveCount(0);
});

test("[AC-079] employee submits a claim with an over-limit line successfully", async ({
  page,
  request,
}) => {
  const a = adminCredentials();
  const admin = await login(request, a.email, a.password);
  const cat = await makeCategory(request, admin, "50.00");
  const emp = await makeUser(request, admin, "Employee");
  const c = await claimWith(request, emp.token, [{ category: cat, amount: "50.01" }]);
  await signInUi(page, emp.email, emp.password);
  await page.goto(`/claims/${c.id}`);
  await page.getByRole("button", { name: "Submit claim" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Pending");
  const got = await (
    await request.get(`${API}/api/claims/${c.id}`, { headers: auth(emp.token) })
  ).json();
  expect(got.status).toBe("pending_finance");
});

test("[NFR-008] over-limit claim data is limited by role", async ({ request }) => {
  // Hosting region and encryption are infrastructure and not testable here; role-limited access is.
  const a = adminCredentials();
  const admin = await login(request, a.email, a.password);
  const cat = await makeCategory(request, admin, "50.00");
  const emp = await makeUser(request, admin, "Employee");
  const other = await makeUser(request, admin, "Employee");
  const c = await claimWith(request, emp.token, [{ category: cat, amount: "50.01" }]);
  expect((await request.get(`${API}/api/claims/${c.id}`)).status()).toBe(401);
  expect(
    (await request.get(`${API}/api/claims/${c.id}`, { headers: auth(other.token) })).status(),
  ).toBe(404);
  expect(
    (await request.get(`${API}/api/approvals/queue`, { headers: auth(emp.token) })).status(),
  ).toBe(403);
  expect(
    (await request.get(`${API}/api/claims/${c.id}`, { headers: auth(emp.token) })).status(),
  ).toBe(200);
});
