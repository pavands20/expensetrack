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
  const password = `Pw-${crypto.randomUUID()}`;
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

async function adminToken(request: APIRequestContext) {
  const a = adminCredentials();
  return login(request, a.email, a.password);
}

async function draft(request: APIRequestContext, token: string, description: string) {
  const c = await (
    await request.post(`${API}/api/claims`, { headers: auth(token), data: {} })
  ).json();
  const l = await request.post(`${API}/api/claims/${c.id}/lines`, {
    headers: auth(token),
    data: { date: "2026-03-04", category_id: 1, amount_gbp: "5.00", description },
  });
  expect(l.status()).toBe(201);
  const lineId = (await l.json()).lines[0].id as number;
  const u = await request.put(`${API}/api/claims/${c.id}/lines/${lineId}/receipt`, {
    headers: auth(token),
    multipart: { file: { name: "r.png", mimeType: "image/png", buffer: PNG_1PX } },
  });
  expect(u.status()).toBe(200);
  return { id: c.id as number, reference: c.reference as string };
}

const submit = async (request: APIRequestContext, token: string, id: number) =>
  expect(
    (await request.post(`${API}/api/claims/${id}/submit`, { headers: auth(token) })).status(),
  ).toBe(200);

test("[AC-080] claims in several statuses show a count and the right claims per tab", async ({
  page,
  request,
}) => {
  const admin = await adminToken(request);
  const mgr = await makeUser(request, admin, "Manager");
  const emp = await makeUser(request, admin, "Employee", mgr.id);
  const approve = async (token: string, id: number) =>
    expect(
      (
        await request.post(`${API}/api/claims/${id}/decision`, {
          headers: auth(token),
          data: { decision: "approve" },
        })
      ).status(),
    ).toBe(200);
  const d1 = await draft(request, emp.token, "d1");
  const d2 = await draft(request, emp.token, "d2");
  const s1 = await draft(request, emp.token, "s1");
  await submit(request, emp.token, s1.id);
  const m1 = await draft(request, emp.token, "m1");
  await submit(request, emp.token, m1.id);
  await approve(mgr.token, m1.id);
  const a1 = await draft(request, emp.token, "a1");
  await submit(request, emp.token, a1.id);
  await approve(mgr.token, a1.id);
  await approve(admin, a1.id);
  const p1 = await draft(request, emp.token, "p1");
  await submit(request, emp.token, p1.id);
  await approve(mgr.token, p1.id);
  await approve(admin, p1.id);
  const paid = await request.post(`${API}/api/claims/${p1.id}/mark-paid`, {
    headers: auth(admin),
  });
  expect(paid.status()).toBe(200);

  await signInUi(page, emp.email, emp.password);
  const draftTab = page.getByRole("tab", { name: /Draft/ });
  await expect(draftTab).toContainText("2");
  await draftTab.click();
  await expect(page.getByText(d1.reference).first()).toBeVisible();
  await expect(page.getByText(d2.reference).first()).toBeVisible();
  await expect(page.getByText(s1.reference)).toHaveCount(0);
  await expect(page.getByText(p1.reference)).toHaveCount(0);

  const paidTab = page.getByRole("tab", { name: /Paid/ });
  await expect(paidTab).toContainText("1");
  await paidTab.click();
  await expect(page.getByText(p1.reference).first()).toBeVisible();
  await expect(page.getByText(d1.reference)).toHaveCount(0);

  const subTab = page.getByRole("tab", { name: /Submitted/ });
  await expect(subTab).toContainText("1");
  await subTab.click();
  await expect(page.getByText(s1.reference).first()).toBeVisible();

  const mTab = page.getByRole("tab", { name: /Manager approved/ });
  await expect(mTab).toContainText("1");
  await mTab.click();
  await expect(page.getByText(m1.reference).first()).toBeVisible();

  const aTab = page.getByRole("tab", { name: /^Approved/ });
  await expect(aTab).toContainText("1");
  await aTab.click();
  await expect(page.getByText(a1.reference).first()).toBeVisible();
});

test("[AC-081] rejected claim opens as an editable draft showing the approver's comment", async ({
  page,
  request,
}) => {
  const admin = await adminToken(request);
  const mgr = await makeUser(request, admin, "Manager");
  const emp = await makeUser(request, admin, "Employee", mgr.id);
  const c = await draft(request, emp.token, "rej");
  await submit(request, emp.token, c.id);
  const comment = `Please fix ${crypto.randomUUID().slice(0, 8)}`;
  const d = await request.post(`${API}/api/claims/${c.id}/decision`, {
    headers: auth(mgr.token),
    data: { decision: "reject", comment },
  });
  expect(d.status()).toBe(200);

  await signInUi(page, emp.email, emp.password);
  await page.getByRole("tab", { name: /Draft/ }).click();
  await expect(page.getByText(c.reference).first()).toBeVisible();
  await page
    .getByRole("link", { name: new RegExp(c.reference) })
    .first()
    .click();
  await expect(page).toHaveURL(new RegExp(`/claims/${c.id}`));
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Draft");
  await expect(page.getByText(comment).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit claim" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit", exact: true }).first()).toBeVisible();
});

for (const role of ["Employee", "Finance"]) {
  test(`[AC-082][NFR-008] another user's claims never appear on a ${role} dashboard`, async ({
    page,
    request,
  }) => {
    const admin = await adminToken(request);
    const me = await makeUser(request, admin, role);
    const other = await makeUser(request, admin, "Employee");
    const mine = await draft(request, me.token, "mine");
    const theirs = await draft(request, other.token, "theirs");
    const theirsSubmitted = await draft(request, other.token, "theirs2");
    await submit(request, other.token, theirsSubmitted.id);

    await signInUi(page, me.email, me.password);
    await expect(page.getByRole("tab", { name: /Draft/ })).toContainText("1");
    await page.getByRole("tab", { name: /Draft/ }).click();
    await expect(page.getByText(mine.reference).first()).toBeVisible();
    await expect(page.getByText(theirs.reference)).toHaveCount(0);
    await page.getByRole("tab", { name: /Submitted/ }).click();
    await expect(page.getByText(theirsSubmitted.reference)).toHaveCount(0);
    await expect(page.getByText(other.name)).toHaveCount(0);
  });
}

test("[AC-083] a user with no claims sees the empty state with a way to create a claim", async ({
  page,
  request,
}) => {
  const admin = await adminToken(request);
  const emp = await makeUser(request, admin, "Employee");
  await signInUi(page, emp.email, emp.password);
  await expect(page.getByText(/no claims/i).first()).toBeVisible();
  const create = page.getByRole("link", { name: /new claim|create/i }).first();
  await expect(create).toBeVisible();
  await create.click();
  await expect(page).toHaveURL(/\/claim(\b|$)/);
});

// NFR-008 (UK GDPR, eu-west-2, encryption) is infrastructure: not testable here; role-limited
// dashboard data is covered by AC-082.
