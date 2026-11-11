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

async function makeEmployee(request: APIRequestContext, admin: string) {
  const uid = crypto.randomUUID().slice(0, 8);
  const email = `emp-${uid}@example.com`;
  const password = crypto.randomUUID();
  const r = await request.post(`${API}/api/users`, {
    headers: auth(admin),
    data: { name: `Emp ${uid}`, email, role: "Employee", initial_password: password },
  });
  expect(r.status()).toBe(201);
  return { email, password, token: await login(request, email, password) };
}

async function signInUi(page: Page, email: string, password: string) {
  await page.goto("/sign-in");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/dashboard/);
}

async function draft(request: APIRequestContext, token: string, n: number) {
  const c = await (
    await request.post(`${API}/api/claims`, { headers: auth(token), data: {} })
  ).json();
  let lines: number[] = [];
  for (let i = 0; i < n; i++) {
    const l = await request.post(`${API}/api/claims/${c.id}/lines`, {
      headers: auth(token),
      data: { date: "2026-03-04", category_id: 1, amount_gbp: "10.00", description: `Taxi ${i}` },
    });
    expect(l.status()).toBe(201);
    lines = (await l.json()).lines.map((x: { id: number }) => x.id);
  }
  return { id: c.id as number, lines };
}

async function world(request: APIRequestContext, n: number) {
  const admin = (() => {
    const a = adminCredentials();
    return login(request, a.email, a.password);
  })();
  const emp = await makeEmployee(request, await admin);
  const c = await draft(request, emp.token, n);
  return { emp, c, admin: await admin };
}

test("[AC-032] edit a draft line and see new values and total after reload", async ({
  page,
  request,
}) => {
  const { emp, c } = await world(request, 2);
  await signInUi(page, emp.email, emp.password);
  await page.goto(`/claims/${c.id}`);
  await page.getByTestId(`line-${c.lines[0]}`).getByRole("button", { name: "Edit" }).click();
  const form = page.getByTestId(`edit-form-${c.lines[0]}`);
  await form.getByLabel("Edit date").fill("2026-04-02");
  await form.getByLabel("Edit category").selectOption({ label: "Meals" });
  await form.getByLabel("Edit amount").fill("15.25");
  await form.getByLabel("Edit description").fill("Team lunch");
  await form.getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("total")).toHaveText("£25.25");
  await page.reload();
  await expect(page.getByTestId("total")).toHaveText("£25.25");
  const row = page.getByTestId(`line-${c.lines[0]}`);
  await expect(row).toContainText("Meals");
  await expect(row).toContainText("£15.25");
  await expect(row).toContainText("Team lunch");
});

test("[AC-033] remove one of two lines drops it and its receipt; only line refused", async ({
  page,
  request,
}) => {
  const { emp, c } = await world(request, 2);
  const base = `${API}/api/claims/${c.id}/lines/${c.lines[0]}`;
  const up = await request.put(`${base}/receipt`, {
    headers: auth(emp.token),
    multipart: { file: { name: "r.png", mimeType: "image/png", buffer: PNG_1PX } },
  });
  expect(up.status()).toBe(200);
  expect((await request.get(`${base}/receipt-url`, { headers: auth(emp.token) })).status()).toBe(
    200,
  );
  await signInUi(page, emp.email, emp.password);
  await page.goto(`/claims/${c.id}`);
  await page.getByTestId(`line-${c.lines[0]}`).getByRole("button", { name: "Remove" }).click();
  await page.getByRole("button", { name: "Confirm remove" }).click();
  await expect(page.getByTestId(`line-${c.lines[0]}`)).toHaveCount(0);
  await expect(page.getByTestId("total")).toHaveText("£10.00");
  expect((await request.get(`${base}/receipt-url`, { headers: auth(emp.token) })).status()).toBe(
    404,
  );
  await expect(
    page.getByTestId(`line-${c.lines[1]}`).getByRole("button", { name: "Remove" }),
  ).toBeDisabled();
  const last = await request.delete(`${API}/api/claims/${c.id}/lines/${c.lines[1]}`, {
    headers: auth(emp.token),
  });
  expect(last.status()).toBe(409);
});

test("[AC-034] non-draft claim: PATCH/DELETE 409 and no edit controls", async ({
  page,
  request,
}) => {
  const { emp, c } = await world(request, 2);
  for (const id of c.lines) {
    const u = await request.put(`${API}/api/claims/${c.id}/lines/${id}/receipt`, {
      headers: auth(emp.token),
      multipart: { file: { name: "r.png", mimeType: "image/png", buffer: PNG_1PX } },
    });
    expect(u.status()).toBe(200);
  }
  const s = await request.post(`${API}/api/claims/${c.id}/submit`, { headers: auth(emp.token) });
  expect(s.status()).toBe(200);
  const url = `${API}/api/claims/${c.id}/lines/${c.lines[0]}`;
  const p = await request.patch(url, { headers: auth(emp.token), data: { description: "x" } });
  expect(p.status()).toBe(409);
  expect((await request.delete(url, { headers: auth(emp.token) })).status()).toBe(409);
  const got = await (
    await request.get(`${API}/api/claims/${c.id}`, { headers: auth(emp.token) })
  ).json();
  expect(got.lines).toHaveLength(2);
  await signInUi(page, emp.email, emp.password);
  await page.goto(`/claims/${c.id}`);
  await expect(page.getByTestId("total")).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Remove", exact: true })).toHaveCount(0);
});

test("[AC-035][NFR-004] another user's claim: PATCH/DELETE refused, nothing changes", async ({
  request,
}) => {
  const { emp, c, admin } = await world(request, 2);
  const other = await makeEmployee(request, admin);
  const url = `${API}/api/claims/${c.id}/lines/${c.lines[0]}`;
  const p = await request.patch(url, { headers: auth(other.token), data: { description: "x" } });
  expect([403, 404]).toContain(p.status());
  const d = await request.delete(url, { headers: auth(other.token) });
  expect([403, 404]).toContain(d.status());
  const got = await (
    await request.get(`${API}/api/claims/${c.id}`, { headers: auth(emp.token) })
  ).json();
  expect(got.lines).toHaveLength(2);
  expect(got.lines[0].description).toBe("Taxi 0");
  expect((await request.patch(url, { data: { description: "x" } })).status()).toBe(401);
});

// NFR-008 (UK GDPR, eu-west-2, encryption) is infrastructure: not testable here.
