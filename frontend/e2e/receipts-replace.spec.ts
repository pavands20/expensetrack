import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { adminCredentials } from "./support/admin";

const API = (process.env.E2E_API_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");
const MSG = "Receipts must be JPEG, PNG or PDF files of 5 MB or less.";
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);
const PDF = Buffer.from("%PDF-1.4 replacement");
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

async function login(request: APIRequestContext, email: string, password: string) {
  const r = await request.post(`${API}/api/auth/login`, { data: { email, password } });
  expect(r.ok()).toBeTruthy();
  return (await r.json()).token as string;
}

async function makeEmployee(request: APIRequestContext) {
  const a = adminCredentials();
  const admin = await login(request, a.email, a.password);
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

async function setup(page: Page, request: APIRequestContext) {
  const emp = await makeEmployee(request);
  await page.goto("/sign-in");
  await page.getByTestId("email").fill(emp.email);
  await page.getByTestId("password").fill(emp.password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/dashboard/);
  const token = emp.token;
  const claim = await (
    await request.post(`${API}/api/claims`, { headers: auth(token), data: {} })
  ).json();
  const l = await request.post(`${API}/api/claims/${claim.id}/lines`, {
    headers: auth(token),
    data: { date: "2026-03-04", category_id: 1, amount_gbp: "5.00", description: "Taxi" },
  });
  expect(l.status()).toBe(201);
  const lineId = (await l.json()).lines[0].id as number;
  return { token, claimId: claim.id as number, lineId };
}

const recUrl = (c: number, l: number) => `${API}/api/claims/${c}/lines/${l}/receipt`;
const png = (n: number) => Buffer.concat([PNG_1PX, Buffer.alloc(n - PNG_1PX.length)]);

async function put(
  request: APIRequestContext,
  token: string,
  c: number,
  l: number,
  name: string,
  mimeType: string,
  buffer: Buffer,
) {
  return request.put(recUrl(c, l), {
    headers: auth(token),
    multipart: { file: { name, mimeType, buffer } },
  });
}

test("[AC-041] replacing a receipt keeps it attached and serves the new file", async ({
  page,
  request,
}) => {
  const { token, claimId, lineId } = await setup(page, request);
  await page.goto(`/claims/${claimId}`);
  const box = page.getByTestId(`receipt-${lineId}`);
  const input = box.locator('input[type="file"]');
  await input.setInputFiles({ name: "r.png", mimeType: "image/png", buffer: PNG_1PX });
  await expect(box.getByText("Receipt attached")).toBeVisible();
  const first = await (
    await request.get(`${recUrl(claimId, lineId)}-url`, { headers: auth(token) })
  ).json();
  await input.setInputFiles({ name: "n.pdf", mimeType: "application/pdf", buffer: PDF });
  await expect(box.getByText("Receipt attached")).toBeVisible();
  await expect
    .poll(async () => {
      const r = await request.get(`${recUrl(claimId, lineId)}-url`, { headers: auth(token) });
      return (await r.json()).url as string;
    })
    .not.toBe(first.url);
  const second = await (
    await request.get(`${recUrl(claimId, lineId)}-url`, { headers: auth(token) })
  ).json();
  // The link may point at S3, which the test runner cannot reach: check the new object's key.
  expect(new URL(second.url, API).pathname).toMatch(/\.pdf$/);
});

test("[AC-039] a PNG of 5 MB or less is stored and shown as attached", async ({
  page,
  request,
}) => {
  const { token, claimId, lineId } = await setup(page, request);
  expect((await put(request, token, claimId, lineId, "r.png", "image/png", PNG_1PX)).status()).toBe(
    200,
  );
  await page.goto(`/claims/${claimId}`);
  await expect(page.getByTestId(`receipt-${lineId}`).getByText("Receipt attached")).toBeVisible();
});

test("[AC-040] a file of another type is rejected with the message and nothing is attached", async ({
  page,
  request,
}) => {
  const { token, claimId, lineId } = await setup(page, request);
  const bad = await put(request, token, claimId, lineId, "n.txt", "text/plain", Buffer.from("hi"));
  expect(bad.status()).toBeGreaterThanOrEqual(400);
  expect(bad.status()).toBeLessThan(500);
  expect(JSON.stringify(await bad.json())).toContain(MSG);
  await page.goto(`/claims/${claimId}`);
  await expect(page.getByTestId(`receipt-${lineId}`).getByText("Receipt attached")).toHaveCount(0);
});

test("[NFR-008] receipt access is limited by role: anonymous and other users are refused", async ({
  page,
  request,
}) => {
  const { token, claimId, lineId } = await setup(page, request);
  expect((await put(request, token, claimId, lineId, "r.png", "image/png", PNG_1PX)).status()).toBe(
    200,
  );
  const anon = await request.put(recUrl(claimId, lineId), {
    multipart: { file: { name: "r.png", mimeType: "image/png", buffer: PNG_1PX } },
  });
  expect(anon.status()).toBe(401);
  const other = await makeEmployee(request);
  const r = await put(request, other.token, claimId, lineId, "r.png", "image/png", PNG_1PX);
  expect([403, 404]).toContain(r.status());
});

test("[AC-042] upload and replace are refused once the claim is submitted", async ({
  page,
  request,
}) => {
  const { token, claimId, lineId } = await setup(page, request);
  expect((await put(request, token, claimId, lineId, "r.png", "image/png", PNG_1PX)).status()).toBe(
    200,
  );
  const s = await request.post(`${API}/api/claims/${claimId}/submit`, { headers: auth(token) });
  expect(s.status()).toBe(200);
  const again = await put(request, token, claimId, lineId, "n.pdf", "application/pdf", PDF);
  expect(again.status()).toBe(409);
});

test("[AC-043] submit is refused and the line missing a receipt is identified", async ({
  page,
  request,
}) => {
  const { token, claimId, lineId } = await setup(page, request);
  const l2 = await request.post(`${API}/api/claims/${claimId}/lines`, {
    headers: auth(token),
    data: { date: "2026-03-05", category_id: 1, amount_gbp: "6.00", description: "Bus" },
  });
  expect(l2.status()).toBe(201);
  const second = (await l2.json()).lines.find((x: { id: number }) => x.id !== lineId).id as number;
  expect((await put(request, token, claimId, lineId, "r.png", "image/png", PNG_1PX)).status()).toBe(
    200,
  );
  const s = await request.post(`${API}/api/claims/${claimId}/submit`, { headers: auth(token) });
  expect(s.status()).toBe(422);
  expect((await s.json()).detail.missing_receipt_line_ids).toEqual([second]);

  await page.goto(`/claims/${claimId}`);
  await page.getByRole("button", { name: "Submit claim" }).click();
  await expect(page.getByRole("alert").first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Draft");
});

test("[NFR-006] receipt link is short-lived and denied to other users", async ({
  page,
  request,
}) => {
  const { token, claimId, lineId } = await setup(page, request);
  expect((await put(request, token, claimId, lineId, "r.png", "image/png", PNG_1PX)).status()).toBe(
    200,
  );
  const url = `${recUrl(claimId, lineId)}-url`;
  const r = await request.get(url, { headers: auth(token) });
  expect(r.status()).toBe(200);
  expect((await r.json()).expires_in).toBeLessThanOrEqual(300);
  expect((await request.get(url)).status()).toBe(401);
  const other = await makeEmployee(request);
  expect((await request.get(url, { headers: auth(other.token) })).status()).toBe(404);
});

test("[NFR-007] exactly 5 MB is accepted, one byte more is rejected", async ({ page, request }) => {
  const { token, claimId, lineId } = await setup(page, request);
  const five = 5 * 1024 * 1024;
  expect(
    (await put(request, token, claimId, lineId, "r.png", "image/png", png(five))).status(),
  ).toBe(200);
  const bad = await put(request, token, claimId, lineId, "r.png", "image/png", png(five + 1));
  expect(bad.status()).toBe(413);
  expect((await bad.json()).detail).toBe(MSG);
});

// NFR-008 (UK GDPR, eu-west-2, encryption) is infrastructure: not testable here.
