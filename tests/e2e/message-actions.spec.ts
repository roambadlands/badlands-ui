import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Message Actions", () => {
  test.beforeEach(async ({ context }) => {
    await login(context, {
      email: "message-actions-test@example.com",
      name: "Message Actions Test User",
    });
  });

  test.describe("Copy Message", () => {
    test("should have copy button on user messages", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Send a message
      await page.getByTestId("message-input").fill("Hello, test message for copy");
      await page.getByTestId("send-button").click();

      // Wait for user message
      await expect(page.getByTestId("user-message")).toBeVisible();

      // User message should have a copy button
      const userMessage = page.getByTestId("user-message");
      const userCopyButton = userMessage.locator('[aria-label="Copy message"]');
      await expect(userCopyButton).toBeVisible();

      consoleMonitor.assertNoErrors();
    });

    test("should copy message content to clipboard", async ({ page, context }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      // Grant clipboard permissions
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);

      await page.goto("/chat");

      const testMessage = "Copy this specific test message";
      await page.getByTestId("message-input").fill(testMessage);
      await page.getByTestId("send-button").click();

      await expect(page.getByTestId("user-message")).toBeVisible();

      // Find and click the copy button for the user message
      const userMessage = page.getByTestId("user-message");
      const copyButton = userMessage.locator('[aria-label="Copy message"]');

      await copyButton.click();

      // Check that the clipboard contains the message
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toBe(testMessage);

      consoleMonitor.assertNoErrors();
    });

    test("should show confirmation feedback after copying", async ({ page, context }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await context.grantPermissions(["clipboard-read", "clipboard-write"]);

      await page.goto("/chat");

      await page.getByTestId("message-input").fill("Message to copy");
      await page.getByTestId("send-button").click();

      await expect(page.getByTestId("user-message")).toBeVisible();

      const userMessage = page.getByTestId("user-message");
      const copyButton = userMessage.locator('[aria-label="Copy message"]');

      await copyButton.click();

      // Wait for the visual feedback (check icon appears)
      await page.waitForTimeout(100);

      // The tooltip should show "Copied!" after clicking
      await copyButton.hover();

      // Give tooltip time to appear
      await page.waitForTimeout(300);

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("User Messages", () => {
    test("should not have retry button on user messages", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page.getByTestId("message-input").fill("User message");
      await page.getByTestId("send-button").click();

      await expect(page.getByTestId("user-message")).toBeVisible();

      // User messages should NOT have a retry button
      const userMessage = page.getByTestId("user-message");
      const retryButton = userMessage.locator('[aria-label="Try again"]');

      expect(await retryButton.count()).toBe(0);

      consoleMonitor.assertNoErrors();
    });
  });
});
