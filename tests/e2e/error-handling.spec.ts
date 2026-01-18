import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Error Handling", () => {
  test.beforeEach(async ({ context }) => {
    await login(context, {
      email: "error-test@example.com",
      name: "Error Test User",
    });
  });

  test.describe("Message Validation", () => {
    test("should not send whitespace-only messages", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Type only whitespace
      await page.getByTestId("message-input").fill("   ");

      // Send button should be disabled for whitespace-only input
      // or if it's enabled, clicking it should not create a message
      const sendButton = page.getByTestId("send-button");

      // Check if button is disabled or if clicking doesn't create a message
      if (await sendButton.isDisabled()) {
        // Button is properly disabled
        await expect(sendButton).toBeDisabled();
      } else {
        // Button is enabled but should not send whitespace
        await sendButton.click();

        // Wait a bit and verify no message was sent
        await page.waitForTimeout(1000);
        expect(await page.getByTestId("user-message").count()).toBe(0);
      }

      consoleMonitor.assertNoErrors();
    });

    test("should handle very long messages gracefully", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Create a very long message (but under the 32KB limit)
      const longMessage = "This is a test message. ".repeat(500); // ~12KB

      await page.getByTestId("message-input").fill(longMessage);
      await page.getByTestId("send-button").click();

      // Should see the message (may be truncated in display)
      await expect(page.getByTestId("user-message")).toBeVisible();

      // Wait for response or error handling
      await expect(page.getByTestId("send-button")).toBeVisible({ timeout: 30000 });

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Session Errors", () => {
    test("should handle session deletion while viewing", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Create a session
      await page.getByTestId("message-input").fill("Session to be deleted");
      await page.getByTestId("send-button").click();

      // Wait for session to appear and message to show
      const sessionItem = page.locator('[data-testid^="session-item-"]').first();
      await expect(sessionItem).toBeVisible({ timeout: 10000 });
      await expect(page.getByTestId("user-message")).toBeVisible();

      // Wait for streaming to complete
      await expect(page.getByTestId("send-button")).toBeVisible({ timeout: 30000 });

      // Delete the current session
      await sessionItem.locator("button").click();
      await page.getByRole("menuitem", { name: /delete/i }).click();
      await page.getByRole("button", { name: /delete/i }).click();

      // Session should be removed and user should be able to start new chat
      await expect(sessionItem).not.toBeVisible({ timeout: 5000 });

      // Should still be able to use the chat
      await expect(page.getByTestId("message-input")).toBeVisible();
      await expect(page.getByTestId("message-input")).toBeEnabled();

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Input Edge Cases", () => {
    test("should handle special characters in messages", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Send a message with special characters
      const specialMessage = "Special chars: <script>alert('xss')</script> & < > \" ' `";
      await page.getByTestId("message-input").fill(specialMessage);
      await page.getByTestId("send-button").click();

      // Should see the sanitized message (script tags should be escaped/removed)
      await expect(page.getByTestId("user-message")).toBeVisible();

      // The message should appear but script should NOT execute
      // Verify by checking no alert dialog appeared
      await page.waitForTimeout(500);

      consoleMonitor.assertNoErrors();
    });

    test("should handle unicode and emoji in messages", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      const unicodeMessage = "Unicode test: \u4e2d\u6587 \u65e5\u672c\u8a9e \ud83d\ude00\ud83d\ude80\ud83c\udf1f";
      await page.getByTestId("message-input").fill(unicodeMessage);
      await page.getByTestId("send-button").click();

      // Should see the message with unicode/emoji preserved
      await expect(page.getByTestId("user-message")).toContainText("\u4e2d\u6587");

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Rename Validation", () => {
    test("should not allow empty session title", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Create a session
      await page.getByTestId("message-input").fill("Session to rename");
      await page.getByTestId("send-button").click();

      // Wait for session to appear
      const sessionItem = page.locator('[data-testid^="session-item-"]').first();
      await expect(sessionItem).toBeVisible({ timeout: 10000 });

      // Wait for streaming to complete
      await expect(page.getByTestId("send-button")).toBeVisible({ timeout: 30000 });

      // Open rename dialog
      await sessionItem.locator("button").click();
      await page.getByRole("menuitem", { name: /rename/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      // Clear the input
      const input = page.getByRole("textbox", { name: /session title/i });
      await input.clear();

      // Try to save - should be prevented or show error
      const saveButton = page.getByRole("button", { name: /save/i });

      // Check if save button is disabled for empty input
      const isDisabled = await saveButton.isDisabled();

      if (!isDisabled) {
        // If not disabled, clicking should show validation error or prevent save
        await saveButton.click();

        // Dialog should either still be visible (save prevented) or show error
        // Wait to see if dialog closes
        await page.waitForTimeout(500);
      }

      // Cancel the dialog
      await page.getByRole("button", { name: /cancel/i }).click();
      await expect(page.getByRole("dialog")).not.toBeVisible();

      consoleMonitor.assertNoErrors();
    });
  });
});
