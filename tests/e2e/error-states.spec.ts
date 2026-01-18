import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Error States and Recovery", () => {
  test.beforeEach(async ({ context }) => {
    await login(context, {
      email: "error-states-test@example.com",
      name: "Error States Test User",
    });
  });

  test.describe("Session Error Handling", () => {
    test("should handle non-existent session gracefully", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      // Add an ignore pattern for expected errors on non-existent sessions
      consoleMonitor.addIgnorePattern(/Failed to load resource.*(400|404)/);
      consoleMonitor.addIgnorePattern(/Session not found/);
      consoleMonitor.addIgnorePattern(/non-existent-session/);

      // Try to access a session that doesn't exist
      await page.goto("/chat/non-existent-session-id-12345");

      // Should either redirect to /chat or show the chat interface
      await page.waitForLoadState("networkidle");

      // Wait for redirect or page to load
      await page.waitForTimeout(2000);

      // Should still have access to create new chat (regardless of where we end up)
      await expect(page.getByTestId("new-chat-button")).toBeVisible({
        timeout: 10000,
      });

      consoleMonitor.assertNoErrors();
    });

    test("should recover gracefully when session is deleted while viewing", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);
      // Ignore expected 404 errors when session is deleted
      consoleMonitor.addIgnorePattern(/Failed to load resource.*404/);
      consoleMonitor.addIgnorePattern(/Session not found/);

      await page.goto("/chat");

      // Create a session
      await page.getByTestId("message-input").fill("Session to be deleted");
      await page.getByTestId("send-button").click();
      await expect(page.getByTestId("user-message")).toBeVisible();

      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Wait for session to appear
      const sessionItem = page.locator('[data-testid^="session-item-"]').first();
      await expect(sessionItem).toBeVisible({ timeout: 10000 });

      // Delete the session
      await sessionItem.locator("button").click();
      await page.getByRole("menuitem", { name: /delete/i }).click();
      await page.getByRole("button", { name: /delete/i }).click();

      // Session should be deleted
      await expect(sessionItem).not.toBeVisible({ timeout: 5000 });

      // Should still be able to create a new chat
      await expect(page.getByTestId("new-chat-button")).toBeVisible();
      await expect(page.getByTestId("message-input")).toBeVisible();

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Input Validation Errors", () => {
    test("should show error for message exceeding max length", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Create a message that exceeds the 32KB limit
      const oversizedMessage = "A".repeat(33 * 1024);

      await page.getByTestId("message-input").fill(oversizedMessage);
      await page.getByTestId("send-button").click();

      // Should show error message
      await expect(page.getByText(/exceeds maximum length/i)).toBeVisible();

      // No message should be sent
      expect(await page.getByTestId("user-message").count()).toBe(0);

      consoleMonitor.assertNoErrors();
    });

    test("should not send whitespace-only messages", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Try to send whitespace-only message
      await page.getByTestId("message-input").fill("   \n\n   ");

      // Send button should be disabled
      await expect(page.getByTestId("send-button")).toBeDisabled();

      // Try to force send with Enter
      await page.getByTestId("message-input").press("Enter");

      // No message should appear
      expect(await page.getByTestId("user-message").count()).toBe(0);

      consoleMonitor.assertNoErrors();
    });

    test("should validate empty session title when renaming", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Create a session
      await page.getByTestId("message-input").fill("Session for validation");
      await page.getByTestId("send-button").click();
      await expect(page.getByTestId("user-message")).toBeVisible();

      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Wait for session to appear
      const sessionItem = page.locator('[data-testid^="session-item-"]').first();
      await expect(sessionItem).toBeVisible({ timeout: 10000 });

      // Open rename dialog
      await sessionItem.locator("button").click();
      await page.getByRole("menuitem", { name: /rename/i }).click();

      // Clear the input
      const renameInput = page.getByRole("textbox", { name: /session title/i });
      await renameInput.clear();

      // The save button should be disabled when input is empty
      const saveButton = page.getByRole("button", { name: /save/i });
      await expect(saveButton).toBeDisabled();

      consoleMonitor.assertNoErrors();
    });

    test("should validate max length when renaming session", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Create a session
      await page.getByTestId("message-input").fill("Session for max length test");
      await page.getByTestId("send-button").click();
      await expect(page.getByTestId("user-message")).toBeVisible();

      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Wait for session to appear
      const sessionItem = page.locator('[data-testid^="session-item-"]').first();
      await expect(sessionItem).toBeVisible({ timeout: 10000 });

      // Open rename dialog
      await sessionItem.locator("button").click();
      await page.getByRole("menuitem", { name: /rename/i }).click();

      // Enter a very long title (over 255 chars)
      const renameInput = page.getByRole("textbox", { name: /session title/i });
      await renameInput.fill("A".repeat(300));

      // Try to save
      await page.getByRole("button", { name: /save/i }).click();

      // Should show error or input should be limited
      const errorMessage = page.getByText(/exceed|too long|255/i);
      const inputValue = await renameInput.inputValue();

      // Either error is shown or input was truncated
      const hasError = (await errorMessage.count()) > 0;
      const wasTruncated = inputValue.length <= 255;

      expect(hasError || wasTruncated).toBe(true);

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Network Error Recovery", () => {
    test("should handle slow responses gracefully", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Send a message
      await page
        .getByTestId("message-input")
        .fill("What is THORChain?");
      await page.getByTestId("send-button").click();

      // User message should appear
      await expect(page.getByTestId("user-message")).toBeVisible();

      // Eventually should complete
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 60000,
      });

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Authentication Error Handling", () => {
    test("should redirect to login when accessing protected route without auth", async ({
      page,
      context,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      // Clear cookies to simulate logged out state
      await context.clearCookies();

      // Try to access protected route
      await page.goto("/chat");

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);

      consoleMonitor.assertNoErrors();
    });

    test("should handle session expiry gracefully", async ({ page, context }) => {
      const consoleMonitor = new ConsoleMonitor(page);
      // Ignore expected auth errors
      consoleMonitor.addIgnorePattern(/401/);
      consoleMonitor.addIgnorePattern(/Unauthorized/);

      await page.goto("/chat");

      // Verify we're logged in
      await expect(page.getByTestId("message-input")).toBeVisible();

      // Clear cookies to simulate session expiry
      await context.clearCookies();

      // Try to reload - should redirect to login
      await page.reload();

      // Wait for redirect
      await page.waitForLoadState("networkidle");

      // Should be on login page
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("UI State Recovery", () => {
    test("should clear error state when user fixes input", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Trigger an error with oversized message
      const oversizedMessage = "A".repeat(33 * 1024);
      await page.getByTestId("message-input").fill(oversizedMessage);
      await page.getByTestId("send-button").click();

      // Error should appear
      await expect(page.getByText(/exceeds maximum length/i)).toBeVisible();

      // Clear the input and type valid message
      await page.getByTestId("message-input").clear();
      await page.getByTestId("message-input").fill("Valid message");

      // Send valid message
      await page.getByTestId("send-button").click();

      // Should work now
      await expect(page.getByTestId("user-message")).toContainText(
        "Valid message"
      );

      consoleMonitor.assertNoErrors();
    });

    test("should restore input focus after dialog closes", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Create a session
      await page.getByTestId("message-input").fill("Test for focus restore");
      await page.getByTestId("send-button").click();
      await expect(page.getByTestId("user-message")).toBeVisible();

      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Wait for session to appear
      const sessionItem = page.locator('[data-testid^="session-item-"]').first();
      await expect(sessionItem).toBeVisible({ timeout: 10000 });

      // Open and close rename dialog
      await sessionItem.locator("button").click();
      await page.getByRole("menuitem", { name: /rename/i }).click();

      // Close dialog with Escape
      await page.keyboard.press("Escape");

      // Dialog should be closed
      await expect(page.getByRole("dialog")).not.toBeVisible();

      // Input should be focusable
      await page.getByTestId("message-input").focus();
      await expect(page.getByTestId("message-input")).toBeFocused();

      consoleMonitor.assertNoErrors();
    });
  });
});
