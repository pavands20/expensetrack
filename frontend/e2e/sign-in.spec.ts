import { expect, test } from "@playwright/test";

// The bootstrap Finance user is seeded by the application from these variables.
const EMAIL = process.env.BOOTSTRAP_FINANCE_EMAIL ?? process.env.BOOTSTRAP_ADMIN_EMAIL ?? "";
const PASSWORD =
  process.env.BOOTSTRAP_FINANCE_PASSWORD ?? process.env.BOOTSTRAP_ADMIN_PASSWORD ?? "";

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/sign-in");
  await page.getByPlaceholder("Email").fill(EMAIL);
  await page.getByPlaceholder("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
}

test.describe("sign-in", () => {
  test("[AC-017] Finance user signs in and lands on /dashboard", async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, "bootstrap credentials not provided");
    await signIn(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId("current-user")).toContainText("finance");
  });

  test("[AC-018] wrong credentials show only the generic message", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByPlaceholder("Email").fill("nobody@example.com");
    await page.getByPlaceholder("Password").fill("wrong-password-1");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByRole("alert")).toHaveText("Invalid email or password");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("[AC-019] signed-out visit to /dashboard redirects to /sign-in", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("[AC-021] sign out returns to /sign-in and back does not reveal data", async ({
    page,
  }) => {
    test.skip(!EMAIL || !PASSWORD, "bootstrap credentials not provided");
    await signIn(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/sign-in/);
    await page.goBack();
    await expect(page.getByTestId("current-user")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "My claims" })).toHaveCount(0);
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("[AC-004] sign-in page has no register, Google or Apple control", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: /sign in to expensetrack/i })).toBeVisible();
    await expect(page.getByText(/create account|register|sign up/i)).toHaveCount(0);
    await expect(page.getByText(/google/i)).toHaveCount(0);
    await expect(page.getByText(/apple/i)).toHaveCount(0);
  });
});
