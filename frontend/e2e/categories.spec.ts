import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { adminCredentials } from "./support/admin";

const API = (process.env.E2E_API_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");

async function login(request: APIRequestContext, email: string, password: string): Promise<string> {
  const r = await request.post(`${API}/api/auth/login`, { data: { email, password } });
  expect(r.ok()).toBeTruthy();
  return (await r.json()).token as string;
}
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

async function adminToken(request: APIRequestContext) {
  const a = adminCredentials();
  return login(request, a.email, a.password);
}

async function signInUi(page: Page, email: string, password: string) {
  await page.goto("/sign-in");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/dashboard/);
}

async function makeCategory(request: APIRequestContext, token: string, name: string) {
  const r = await request.post(`${API}/api/categories`, { headers: auth(token), data: { name } });
  expect(r.status()).toBe(201);
  return (await r.json()) as { id: number; name: string };
}

async function makeEmployee(request: APIRequestContext, token: string, uid: string) {
  const email = `emp-${uid}@example.com`;
  const password = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  const r = await request.post(`${API}/api/users`, {
    headers: auth(token),
    data: { name: `Emp ${uid}`, email, role: "Employee", initial_password: password },
  });
  expect(r.status()).toBe(201);
  return { email, password };
}

test("[AC-072] first admin sees the seed categories with No limit", async ({ page }) => {
  const a = adminCredentials();
  await signInUi(page, a.email, a.password);
  await page.goto("/admin/categories");
  await expect(page.getByRole("heading", { name: "Categories" })).toBeVisible();
  for (const name of ["Travel", "Meals", "Equipment", "Other"]) {
    const row = page.locator("tr", { has: page.locator(`input[value="${name}"]`) });
    await expect(row).toHaveCount(1);
    await expect(row.getByText("No limit")).toBeVisible();
  }
});

test("[AC-073] limit persists after reload and clearing shows No limit", async ({
  page,
  request,
}) => {
  const token = await adminToken(request);
  const cat = await makeCategory(request, token, `Lim ${crypto.randomUUID().slice(0, 8)}`);
  const a = adminCredentials();
  await signInUi(page, a.email, a.password);
  await page.goto("/admin/categories");
  await page.getByTestId(`limit-${cat.id}`).fill("25.50");
  await page.getByTestId(`save-limit-${cat.id}`).click();
  await expect(page.getByTestId(`limit-text-${cat.id}`)).toHaveText("£25.50");
  await page.reload();
  await expect(page.getByTestId(`limit-text-${cat.id}`)).toHaveText("£25.50");
  await page.getByTestId(`clear-limit-${cat.id}`).click();
  await expect(page.getByTestId(`limit-text-${cat.id}`)).toHaveText("No limit");
  await page.reload();
  await expect(page.getByTestId(`limit-text-${cat.id}`)).toHaveText("No limit");
});

test("[AC-074][NFR-011] retired category hidden from Employee list but kept for Finance", async ({
  request,
}) => {
  const token = await adminToken(request);
  const uid = crypto.randomUUID().slice(0, 8);
  const cat = await makeCategory(request, token, `Ret ${uid}`);
  const emp = await makeEmployee(request, token, uid);
  const empToken = await login(request, emp.email, emp.password);

  const before = await (
    await request.get(`${API}/api/categories`, { headers: auth(empToken) })
  ).json();
  expect(before.map((c: { id: number }) => c.id)).toContain(cat.id);

  const p = await request.patch(`${API}/api/categories/${cat.id}`, {
    headers: auth(token),
    data: { is_active: false },
  });
  expect(p.ok()).toBeTruthy();

  const after = await (
    await request.get(`${API}/api/categories`, { headers: auth(empToken) })
  ).json();
  expect(after.map((c: { id: number }) => c.id)).not.toContain(cat.id);
  const fin = await (
    await request.get(`${API}/api/categories?include_retired=true`, { headers: auth(token) })
  ).json();
  const found = fin.find((c: { id: number }) => c.id === cat.id);
  expect(found).toBeTruthy();
  expect(found.is_active).toBe(false);
});

test("[AC-075][NFR-004] Employee gets 403 on POST/PATCH and has no Categories nav link", async ({
  page,
  request,
}) => {
  const token = await adminToken(request);
  const uid = crypto.randomUUID().slice(0, 8);
  const cat = await makeCategory(request, token, `Rbac ${uid}`);
  const emp = await makeEmployee(request, token, uid);
  const empToken = await login(request, emp.email, emp.password);

  const post = await request.post(`${API}/api/categories`, {
    headers: auth(empToken),
    data: { name: `Nope ${uid}` },
  });
  expect(post.status()).toBe(403);
  const patch = await request.patch(`${API}/api/categories/${cat.id}`, {
    headers: auth(empToken),
    data: { limit_gbp: "5.00" },
  });
  expect(patch.status()).toBe(403);

  await signInUi(page, emp.email, emp.password);
  await expect(page.getByRole("link", { name: "Categories" })).toHaveCount(0);
});

test("[AC-076] duplicate names, including different case, are refused", async ({
  page,
  request,
}) => {
  const token = await adminToken(request);
  const name = `Dup ${crypto.randomUUID().slice(0, 8)}`;
  await makeCategory(request, token, name);
  const a = adminCredentials();
  await signInUi(page, a.email, a.password);
  await page.goto("/admin/categories");
  const rows = page.locator("tbody tr");
  await expect(rows.first()).toBeVisible();
  const count = await rows.count();
  for (const attempt of [name, name.toUpperCase()]) {
    await page.getByTestId("new-name").fill(attempt);
    await page.getByTestId("create-submit").click();
    await expect(page.getByTestId("name-error")).toHaveText(
      "A category with that name already exists",
    );
    await expect(rows).toHaveCount(count);
  }
});
