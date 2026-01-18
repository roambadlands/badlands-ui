import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Navigation", () => {
  test.describe("Home Page Redirects", () => {
    test("should redirect unauthenticated users from home to login", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/");

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);

      consoleMonitor.assertNoErrors();
    });

    test("should redirect authenticated users from home to chat", async ({
      page,
      context,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await login(context, {
        email: "nav-test@example.com",
        name: "Nav Test User",
      });

      await page.goto("/");

      // Should redirect to chat
      await expect(page).toHaveURL(/\/chat/);

      consoleMonitor.assertNoErrors();
    });

    test("should redirect authenticated users from login to chat", async ({
      page,
      context,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await login(context, {
        email: "nav-test@example.com",
        name: "Nav Test User",
      });

      await page.goto("/login");

      // Should redirect to chat
      await expect(page).toHaveURL(/\/chat/);

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Direct Session URLs", () => {
    test("should navigate directly to a specific session", async ({
      page,
      context,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await login(context, {
        email: "nav-test@example.com",
        name: "Nav Test User",
      });

      // First create a session
      await page.goto("/chat");
      await page.getByTestId("message-input").fill("Create session for direct access");
      await page.getByTestId("send-button").click();

      // Wait for session to be created and URL to update
      await expect(page).toHaveURL(/\/chat\/[a-f0-9-]+/, { timeout: 15000 });

      // Get the session URL
      const sessionUrl = page.url();
      const sessionId = sessionUrl.split("/chat/")[1];

      // Navigate away
      await page.goto("/chat");

      // Navigate directly back to the session
      await page.goto(`/chat/${sessionId}`);

      // Should show the session's message
      await expect(page.getByTestId("user-message")).toContainText(
        "Create session for direct access"
      );

      consoleMonitor.assertNoErrors();
    });

    test("should redirect to /chat when accessing non-existent session", async ({
      page,
      context,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await login(context, {
        email: "nav-test@example.com",
        name: "Nav Test User",
      });

      // Try to access a non-existent session
      await page.goto("/chat/non-existent-session-id-12345");

      // Should redirect to /chat (the base chat page)
      // or show an error state - either way should not crash
      await expect(page.getByTestId("message-input")).toBeVisible({ timeout: 10000 });

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Static Pages", () => {
    test("should navigate from login to terms and display content", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/login");

      // Click terms link
      await page.getByRole("link", { name: /terms/i }).click();

      // Should be on terms page
      await expect(page).toHaveURL(/\/terms/);
      await expect(page.locator("h1")).toContainText("Terms & Conditions");

      // Check key content sections exist
      await expect(page.getByRole("heading", { name: "General Terms" })).toBeVisible();
      await expect(page.getByText("Back to Login")).toBeVisible();

      // Click back to login
      await page.getByText("Back to Login").click();

      // Should be back on login
      await expect(page).toHaveURL(/\/login/);

      consoleMonitor.assertNoErrors();
    });

    test("should navigate from login to privacy and display content", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/login");

      // Click privacy link
      await page.getByRole("link", { name: /privacy/i }).click();

      // Should be on privacy page
      await expect(page).toHaveURL(/\/privacy/);
      await expect(page.locator("h1")).toContainText("Privacy Policy");

      // Check key content sections exist
      await expect(page.getByRole("heading", { name: "What Information Do We Collect?" })).toBeVisible();
      await expect(page.getByText("Back to Login")).toBeVisible();

      // Click back to login
      await page.getByText("Back to Login").click();

      // Should be back on login
      await expect(page).toHaveURL(/\/login/);

      consoleMonitor.assertNoErrors();
    });
  });
});
