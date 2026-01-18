import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Authentication", () => {
  test.describe("Login Page", () => {
    test("should display login page with OAuth buttons", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/login");

      // Check page title
      await expect(page.locator("h1")).toContainText("Welcome to Badlands");

      // Check OAuth buttons are present
      await expect(
        page.getByRole("button", { name: /Google/i })
      ).toBeVisible();
      await expect(page.getByRole("button", { name: /Apple/i })).toBeVisible();
      await expect(
        page.getByRole("button", { name: /Discord/i })
      ).toBeVisible();

      consoleMonitor.assertNoErrors();
    });

    test("should redirect to login when accessing protected route without auth", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Authenticated User", () => {
    test("should access protected route after test login", async ({
      page,
      context,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      // Login via test endpoint
      await login(context, {
        email: "test@example.com",
        name: "Test User",
      });

      // Navigate to protected route
      await page.goto("/chat");

      // Should not redirect to login
      await expect(page).not.toHaveURL(/\/login/);

      // Should see the chat interface
      await expect(page.getByTestId("message-input")).toBeVisible();

      consoleMonitor.assertNoErrors();
    });

    test("should display user info in header", async ({ page, context }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await login(context, {
        email: "john@example.com",
        name: "John Doe",
      });

      await page.goto("/chat");

      // User menu should be visible
      await expect(page.getByTestId("user-menu")).toBeVisible();

      // Click user menu to see user info
      await page.getByTestId("user-menu").click();

      // Should show user name and email
      await expect(page.getByText("John Doe")).toBeVisible();
      await expect(page.getByText("john@example.com")).toBeVisible();

      consoleMonitor.assertNoErrors();
    });

    test("should logout and redirect to login", async ({ page, context }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await login(context, {
        email: "test@example.com",
        name: "Test User",
      });

      await page.goto("/chat");

      // Open user menu and click logout
      await page.getByTestId("user-menu").click();
      await page.getByTestId("logout-button").click();

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);

      // Trying to access chat should redirect to login
      await page.goto("/chat");
      await expect(page).toHaveURL(/\/login/);

      consoleMonitor.assertNoErrors();
    });
  });
});
