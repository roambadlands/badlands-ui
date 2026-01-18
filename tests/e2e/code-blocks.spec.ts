import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Code Blocks", () => {
  test.beforeEach(async ({ context }) => {
    await login(context, {
      email: "code-blocks-test@example.com",
      name: "Code Blocks Test User",
    });
  });

  test.describe("Code Block Component", () => {
    test("should request code and complete without errors", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Request a code block - the AI may or may not include one
      await page
        .getByTestId("message-input")
        .fill("Show me a simple hello world function");
      await page.getByTestId("send-button").click();

      // Wait for user message to appear
      await expect(page.getByTestId("user-message")).toBeVisible();

      // Wait for response to complete (send button returns)
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Verify no console errors during the flow
      consoleMonitor.assertNoErrors();
    });

    test("should handle code-related queries gracefully", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Ask a programming question
      await page
        .getByTestId("message-input")
        .fill("What is a function in Python?");
      await page.getByTestId("send-button").click();

      // User message should appear
      await expect(page.getByTestId("user-message")).toContainText(
        "What is a function in Python?"
      );

      // Wait for response
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Message Copy Functionality", () => {
    test("should have copy button on messages", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Send a message
      await page.getByTestId("message-input").fill("Test message for copy");
      await page.getByTestId("send-button").click();

      // User message should have copy button
      const userMessage = page.getByTestId("user-message");
      await expect(userMessage).toBeVisible();

      const copyButton = userMessage.locator('[aria-label="Copy message"]');
      await expect(copyButton).toBeVisible();

      // Wait for response
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      consoleMonitor.assertNoErrors();
    });

    test("should copy message content to clipboard", async ({
      page,
      context,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      // Grant clipboard permissions
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);

      await page.goto("/chat");

      const testContent = "Copy this exact message";
      await page.getByTestId("message-input").fill(testContent);
      await page.getByTestId("send-button").click();

      // Wait for user message
      await expect(page.getByTestId("user-message")).toBeVisible();

      // Click copy on user message
      const copyButton = page
        .getByTestId("user-message")
        .locator('[aria-label="Copy message"]');
      await copyButton.click();

      // Verify clipboard
      const clipboardText = await page.evaluate(() =>
        navigator.clipboard.readText()
      );
      expect(clipboardText).toBe(testContent);

      // Wait for response
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      consoleMonitor.assertNoErrors();
    });
  });
});
