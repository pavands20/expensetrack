import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { adminCredentials } from "./support/admin";

const API = (process.env.E2E_API_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");
const MSG = "Receipts must be JPEG, PNG or PDF files of 5 MB or less.";
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

async function setup(page: Page, request: APIRequestContext) {
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
  const token = await login(request, email, password);
  await page.goto("/sign-in");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/dashboard/);
  const c = await request.post(`${API}/api/claims`, { headers: auth(token), data: {} });
  const claim = await c.json();
  const l = await request.post(`${API}/api/claims/${claim.id}/lines`, {
    headers: auth(token),
    data: { date: "2026-03-04", category_id: 1, amount_gbp: "5.00", description: "Taxi" },
  });
  expect(l.status()).toBe(201);
  const lineId = (await l.json()).lines[0].id as number;
  return { token, claimId: claim.id as number, lineId };
}

test("[AC-039] upload a PNG and see Receipt attached", async ({ page, request }) => {
  const { claimId, lineId } = await setup(page, request);
  await page.goto(`/claims/${claimId}`);
  const box = page.getByTestId(`receipt-${lineId}`);
  await expect(box.getByText("No receipt")).toBeVisible();
  await box
    .locator('input[type="file"]')
    .setInputFiles({ name: "r.png", mimeType: "image/png", buffer: PNG_1PX });
  await expect(box.getByText("Receipt attached")).toBeVisible();
});

test("[AC-040] 6 MB file and .txt are rejected with the message, no receipt", async ({
  page,
  request,
}) => {
  const { token, claimId, lineId } = await setup(page, request);
  await page.goto(`/claims/${claimId}`);
  const box = page.getByTestId(`receipt-${lineId}`);
  const input = box.locator('input[type="file"]');
  await input.setInputFiles({
    name: "big.png",
    mimeType: "image/png",
    buffer: Buffer.concat([PNG_1PX, Buffer.alloc(6 * 1024 * 1024)]),
  });
  await expect(box.getByRole("alert")).toHaveText(MSG);
  await input.setInputFiles({ name: "a.txt", mimeType: "text/plain", buffer: Buffer.from("hi") });
  await expect(box.getByRole("alert")).toHaveText(MSG);
  await expect(box.getByText("No receipt")).toBeVisible();

  const big = await request.put(`${API}/api/claims/${claimId}/lines/${lineId}/receipt`, {
    headers: auth(token),
    multipart: {
      file: {
        name: "big.png",
        mimeType: "image/png",
        buffer: Buffer.concat([PNG_1PX, Buffer.alloc(6 * 1024 * 1024)]),
      },
    },
  });
  expect(big.status()).toBe(413);
  expect((await big.json()).detail).toBe(MSG);
  const txt = await request.put(`${API}/api/claims/${claimId}/lines/${lineId}/receipt`, {
    headers: auth(token),
    multipart: { file: { name: "a.txt", mimeType: "text/plain", buffer: Buffer.from("hi") } },
  });
  expect(txt.status()).toBe(415);
  expect((await txt.json()).detail).toBe(MSG);
  const c = await (
    await request.get(`${API}/api/claims/${claimId}`, { headers: auth(token) })
  ).json();
  expect(c.lines[0].has_receipt).toBe(false);
});
