import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { adminCredentials } from "./support/admin";

const API = (process.env.E2E_API_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

async function login(request: APIRequestContext, email: string, password: string) {
  const r = await request.post(`${API}/api/auth/login`, { data: { email, password } });
  expect(r.ok()).toBeTruthy();
  return (await r.json()).token as string;
}

async function makeUser(request: APIRequestContext, role: string) {
  const a = adminCredentials();
  const admin = await login(request, a.email, a.password);
  const uid = crypto.randomUUID().slice(0, 8);
  const email = `${role.toLowerCase()}-${uid}@example.com`;
  const password = crypto.randomUUID();
  const r = await request.post(`${API}/api/users`, {
    headers: auth(admin),
    data: { name: `${role} ${uid}`, email, role, initial_password: password },
  });
  expect(r.status()).toBe(201);
  return { email, password };
}

async function signInUi(page: Page, email: string, password: string) {
  await page.goto("/sign-in");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/dashboard/);
}

async function openSection(page: Page, name: RegExp) {
  await page.getByRole("button", { name }).click();
}

test("[AC-101][NFR-014] guide covers claims, receipts, approvals and Finance tasks for each role", async ({
  page,
  request,
}) => {
  const emp = await makeUser(request, "Employee");
  await signInUi(page, emp.email, emp.password);
  await page.getByRole("link", { name: "User guide" }).click();
  await expect(page).toHaveURL(/\/help/);
  await expect(page.getByRole("heading", { level: 1, name: "User guide" })).toBeVisible();

  await openSection(page, /Creating and submitting a claim/);
  await expect(page.getByText(/at least one line/i).first()).toBeVisible();
  await openSection(page, /Uploading receipts/);
  await expect(page.getByText(/JPEG, PNG and PDF/).first()).toBeVisible();
  await expect(page.getByText(/5 MB/).first()).toBeVisible();

  await openSection(page, /What each role can do/);
  for (const role of ["Employee", "Manager", "Finance"]) {
    await expect(page.getByText(role, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByText(/approves or rejects/i).first()).toBeVisible();
  const body = (await page.locator("main").last().innerText()).toLowerCase();
  for (const word of ["categories", "export", "deactivates accounts"]) {
    expect(body).toContain(word);
  }
});

test("[AC-102] guide explains routing: no self approval, no assigned manager, Finance own claim", async ({
  page,
  request,
}) => {
  const fin = await makeUser(request, "Finance");
  await signInUi(page, fin.email, fin.password);
  await page.getByRole("link", { name: "User guide" }).click();
  await openSection(page, /Approval routing and no self approval/);
  const body = (await page.locator("main").last().innerText()).toLowerCase();
  expect(body).toContain("own claim");
  expect(body).toContain("no assigned manager");
  expect(body).toMatch(/straight to finance/);
  expect(body).toMatch(/you are in finance/);
  expect(body).toMatch(/different finance user/);
});

test("[NFR-008] personal data is reachable only with a token and limited by role", async ({
  request,
}) => {
  const a = await makeUser(request, "Employee");
  const b = await makeUser(request, "Employee");
  const tokenA = await login(request, a.email, a.password);
  const tokenB = await login(request, b.email, b.password);

  const users = await request.get(`${API}/api/users`, { headers: auth(tokenA) });
  expect(users.status()).toBe(403);
  expect(await users.json()).toEqual({ detail: "Forbidden" });

  const anon = await request.get(`${API}/api/users`);
  expect(anon.status()).toBe(401);
  expect(await anon.json()).toEqual({ detail: "Not authenticated" });

  const created = await request.post(`${API}/api/claims`, {
    headers: auth(tokenB),
    data: { title: "Private" },
  });
  expect(created.status()).toBe(201);
  const id = (await created.json()).id;
  const other = await request.get(`${API}/api/claims/${id}`, { headers: auth(tokenA) });
  expect(other.status()).toBe(404);
});

// NFR-008 hosting in eu-west-2 and encryption are infrastructure: not testable here.
// NFR-014: the user-guide half is covered above; the setup guide is a document, not testable in e2e.
