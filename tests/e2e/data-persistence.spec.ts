import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Data Persistence", () => {
  test.beforeEach(async ({ context }) => {
    await login(context, {
      email: "persistence-test@example.com",
      name: "Persistence Test User",
    });
  });

  test.describe("Session Persistence", () => {
    test("should retain sessions after page reload", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Create a session with a unique identifier
      const uniqueMessage = `Test session ${Date.now()}`;
      await page.getByTestId("message-input").fill(uniqueMessage);
      await page.getByTestId("send-button").click();

      // Wait for user message to appear
      await expect(page.getByTestId("user-message")).toBeVisible();

      // Wait for response
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Verify session appears in sidebar
      const sessionItem = page.locator('[data-testid^="session-item-"]').first();
      await expect(sessionItem).toBeVisible({ timeout: 10000 });

      // Get the session ID from the URL
      const url = page.url();
      const sessionIdMatch = url.match(/\/chat\/([a-zA-Z0-9-]+)/);
      expect(sessionIdMatch).not.toBeNull();
      const sessionId = sessionIdMatch![1];

      // Reload the page
      await page.reload();

      // Wait for sessions to load
      await expect(page.getByTestId("message-input")).toBeVisible();

      // Session should still be visible in sidebar
      const reloadedSessionItem = page.locator(`[data-testid="session-item-${sessionId}"]`);
      await expect(reloadedSessionItem).toBeVisible({ timeout: 10000 });

      consoleMonitor.assertNoErrors();
    });

    test("should persist message history in session", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Send a message
      const testMessage = "Test message for history persistence";
      await page.getByTestId("message-input").fill(testMessage);
      await page.getByTestId("send-button").click();

      // Wait for user message to appear
      await expect(page.getByTestId("user-message")).toBeVisible();

      // Wait for response to complete
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Get the current URL (session URL)
      const sessionUrl = page.url();

      // Reload the page
      await page.reload();

      // Wait for page to load
      await expect(page.getByTestId("message-input")).toBeVisible();

      // Navigate back to the session
      await page.goto(sessionUrl);

      // Message should still be visible
      await expect(page.getByTestId("user-message")).toContainText(
        testMessage,
        { timeout: 10000 }
      );

      consoleMonitor.assertNoErrors();
    });

    test("should persist session title after rename", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Create a session
      await page.getByTestId("message-input").fill("Session to rename");
      await page.getByTestId("send-button").click();
      await expect(page.getByTestId("user-message")).toBeVisible();

      // Wait for session to appear
      const sessionItem = page.locator('[data-testid^="session-item-"]').first();
      await expect(sessionItem).toBeVisible({ timeout: 10000 });

      // Wait for streaming to complete
      await expect(page.getByTestId("send-button")).toBeVisible({ timeout: 30000 });

      // Open session menu
      await sessionItem.locator("button").click();

      // Click rename
      await page.getByRole("menuitem", { name: /rename/i }).click();

      // Rename dialog should appear
      await expect(page.getByRole("dialog")).toBeVisible();

      // Rename the session
      const newTitle = `Renamed Session ${Date.now()}`;
      const renameInput = page.getByRole("textbox", { name: /session title/i });
      await renameInput.clear();
      await renameInput.fill(newTitle);

      // Save
      await page.getByRole("button", { name: /save/i }).click();

      // Dialog should close
      await expect(page.getByRole("dialog")).not.toBeVisible();

      // Session should show new title
      await expect(sessionItem).toContainText(newTitle);

      // Reload the page
      await page.reload();

      // Wait for sessions to load
      await expect(page.getByTestId("message-input")).toBeVisible();

      // Session should still have the renamed title
      const reloadedSessionItem = page.locator('[data-testid^="session-item-"]').first();
      await expect(reloadedSessionItem).toContainText(newTitle, { timeout: 10000 });

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Navigation Persistence", () => {
    test("should remember active session after navigation", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Create a session
      await page.getByTestId("message-input").fill("My test session");
      await page.getByTestId("send-button").click();
      await expect(page.getByTestId("user-message")).toBeVisible();

      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Get the session URL
      const sessionUrl = page.url();

      // Navigate away (e.g., to terms page)
      await page.goto("/terms");
      await expect(page.locator("h1")).toContainText(/terms/i);

      // Navigate back
      await page.goto(sessionUrl);

      // Should be viewing the session with original message
      await expect(page.getByTestId("user-message")).toContainText(
        "My test session",
        { timeout: 10000 }
      );

      consoleMonitor.assertNoErrors();
    });

    test("should handle direct session URL access", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Create a session
      await page.getByTestId("message-input").fill("Direct access test");
      await page.getByTestId("send-button").click();
      await expect(page.getByTestId("user-message")).toBeVisible();

      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Get session URL
      const sessionUrl = page.url();

      // Open a new page context and access the URL directly
      const newPage = await page.context().newPage();
      await newPage.goto(sessionUrl);

      // Should display the session content
      await expect(newPage.getByTestId("user-message")).toContainText(
        "Direct access test",
        { timeout: 10000 }
      );

      await newPage.close();
      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Cross-Tab Consistency", () => {
    test("should reflect session deletion in other tabs", async ({
      page,
      context,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Create a session
      await page.getByTestId("message-input").fill("Session to delete");
      await page.getByTestId("send-button").click();
      await expect(page.getByTestId("user-message")).toBeVisible();

      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Get session ID
      const sessionItem = page.locator('[data-testid^="session-item-"]').first();
      await expect(sessionItem).toBeVisible({ timeout: 10000 });
      const sessionTestId = await sessionItem.getAttribute("data-testid");
      const sessionId = sessionTestId?.replace("session-item-", "");

      // Open a second tab
      const secondPage = await context.newPage();
      await secondPage.goto("/chat");

      // Delete the session in the first tab
      await sessionItem.locator("button").click();
      await page.getByRole("menuitem", { name: /delete/i }).click();

      // Confirm deletion
      await page.getByRole("button", { name: /delete/i }).click();

      // Wait for deletion
      await expect(page.locator(`[data-testid="session-item-${sessionId}"]`)).not.toBeVisible({
        timeout: 5000,
      });

      // Refresh second tab
      await secondPage.reload();

      // Session should not appear in second tab
      await expect(
        secondPage.locator(`[data-testid="session-item-${sessionId}"]`)
      ).not.toBeVisible({
        timeout: 5000,
      });

      await secondPage.close();
      consoleMonitor.assertNoErrors();
    });
  });
});
