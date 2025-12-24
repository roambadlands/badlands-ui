import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test("should display login page with OAuth buttons", async ({ page }) => {
    await page.goto("/login");

    // Check page title
    await expect(page.locator("h1")).toContainText("Welcome to Badlands");

    // Check OAuth buttons are present
    await expect(page.getByRole("button", { name: /Google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Apple/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Discord/i })).toBeVisible();
  });

  test("should redirect to login when accessing protected route without auth", async ({
    page,
  }) => {
    await page.goto("/chat");

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
