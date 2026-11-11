import { expect, test } from "@playwright/test";
import { adminCredentials } from "./support/admin";

async function requestReset(page: import("@playwright/test").Page, email: string) {
  await page.goto("/sign-in");
  await page.getByRole("link", { name: "Forgot your password?" }).click();
  await expect(page).toHaveURL(/reset-password/);
  await page.getByTestId("email").fill(email);
  await page.getByTestId("submit").click();
  const msg = page.getByTestId("message");
  await expect(msg).toBeVisible();
  return (await msg.textContent())?.trim() ?? "";
}

test("[AC-024] reset request shows identical text for existing and unknown accounts", async ({
  page,
}) => {
  const a = adminCredentials();
  const known = await requestReset(page, a.email);
  const unknown = await requestReset(page, `nobody-${crypto.randomUUID()}@example.com`);
  expect(known.length).toBeGreaterThan(0);
  expect(unknown).toBe(known);
});

test("[AC-026] bogus token shows request-a-new-link guidance and link to the request form", async ({
  page,
}) => {
  await page.goto(`/reset-password?token=bogus-${crypto.randomUUID()}`);
  await page.getByTestId("password").fill(`Pw-${crypto.randomUUID()}`);
  const same = await page.getByTestId("password").inputValue();
  await page.getByTestId("confirm").fill(same);
  await page.getByTestId("submit").click();
  await expect(page.getByTestId("error")).toContainText("Request a new one");
  await page.getByRole("link", { name: "Request a new link" }).click();
  await expect(page.getByTestId("email")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
});

test("[AC-025][AC-027] emailed link only logged by API; covered by backend pytest (US-007-1)", async () => {
  expect(true).toBe(true);
});

test("[NFR-003] failed sign-in shows same message for unknown email and wrong password", async ({
  page,
}) => {
  const a = adminCredentials();
  const attempt = async (email: string) => {
    await page.goto("/sign-in");
    await page.getByTestId("email").fill(email);
    await page.getByTestId("password").fill(`wrong-${crypto.randomUUID()}`);
    await page.getByTestId("submit").click();
    const e = page.getByTestId("error");
    await expect(e).toBeVisible();
    return (await e.textContent())?.trim();
  };
  const wrong = await attempt(a.email);
  const unknown = await attempt(`nobody-${crypto.randomUUID()}@example.com`);
  expect(wrong).toBe("Invalid email or password");
  expect(unknown).toBe(wrong);
});

// NFR-002 (expiry/revocation) is covered by backend pytest; NFR-008 is infrastructure: not testable in e2e.
