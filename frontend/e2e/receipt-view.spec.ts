import { expect, test, type APIRequestContext } from "@playwright/test";
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

test("[AC-044] View receipt opens the receipt for the owner", async ({ page, request }) => {
  const a = adminCredentials();
  const admin = await login(request, a.email, a.password);
  const uid = crypto.randomUUID().slice(0, 8);
  const email = `emp-${uid}@example.com`;
  const password = crypto.randomUUID();
  const u = await request.post(`${API}/api/users`, {
    headers: auth(admin),
    data: { name: `Emp ${uid}`, email, role: "Employee", initial_password: password },
  });
  expect(u.status()).toBe(201);
  const token = await login(request, email, password);
  const claim = await (
    await request.post(`${API}/api/claims`, { headers: auth(token), data: {} })
  ).json();
  const l = await request.post(`${API}/api/claims/${claim.id}/lines`, {
    headers: auth(token),
    data: { date: "2026-03-04", category_id: 1, amount_gbp: "5.00", description: "Taxi" },
  });
  const lineId = (await l.json()).lines[0].id as number;
  const up = await request.put(`${API}/api/claims/${claim.id}/lines/${lineId}/receipt`, {
    headers: auth(token),
    multipart: { file: { name: "r.png", mimeType: "image/png", buffer: PNG_1PX } },
  });
  expect(up.status()).toBe(200);

  await page.goto("/sign-in");
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("submit").click();
  await expect(page).toHaveURL(/dashboard/);
  await page.goto(`/claims/${claim.id}`);
  const popupPromise = page.waitForEvent("popup");
  await page.getByTestId(`receipt-${lineId}`).getByRole("button", { name: "View receipt" }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  expect(popup.url()).toMatch(/receipt/);
});
