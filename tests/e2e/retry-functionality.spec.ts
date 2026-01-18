import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Retry Functionality", () => {
  test.beforeEach(async ({ context }) => {
    await login(context, {
      email: "retry-test@example.com",
      name: "Retry Test User",
    });
  });

  test.describe("Retry Button Display", () => {
    test("should show retry button on assistant messages after streaming completes", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Send a message - this will create a session and redirect
      await page.getByTestId("message-input").fill("Hello");
      await page.getByTestId("send-button").click();

      // Wait for redirect to session page (URL should change to /chat/{sessionId})
      await page.waitForURL(/\/chat\/[a-zA-Z0-9-]+/, { timeout: 10000 });

      // Wait for assistant response and streaming to complete
      await expect(page.getByTestId("assistant-message")).toBeVisible({
        timeout: 30000,
      });

      // Wait for send button to be re-enabled (streaming complete)
      await expect(page.getByTestId("send-button")).toBeEnabled({
        timeout: 30000,
      });

      // Check for retry button on assistant message
      const assistantMessage = page.getByTestId("assistant-message");
      const retryButton = assistantMessage.locator('[aria-label="Try again"]');

      await expect(retryButton).toBeVisible();

      consoleMonitor.assertNoErrors();
    });

    test("should NOT show retry button on user messages", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Send a message
      await page.getByTestId("message-input").fill("Hello");
      await page.getByTestId("send-button").click();

      // Wait for redirect
      await page.waitForURL(/\/chat\/[a-zA-Z0-9-]+/, { timeout: 10000 });

      // Wait for streaming to complete
      await expect(page.getByTestId("send-button")).toBeEnabled({
        timeout: 30000,
      });

      // Check that retry button is NOT on user message
      const userMessage = page.getByTestId("user-message");
      const retryButton = userMessage.locator('[aria-label="Try again"]');

      expect(await retryButton.count()).toBe(0);

      consoleMonitor.assertNoErrors();
    });

    test("should show retry button with tooltip", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Send a message
      await page.getByTestId("message-input").fill("Hello");
      await page.getByTestId("send-button").click();

      // Wait for redirect
      await page.waitForURL(/\/chat\/[a-zA-Z0-9-]+/, { timeout: 10000 });

      // Wait for streaming to complete
      await expect(page.getByTestId("send-button")).toBeEnabled({
        timeout: 30000,
      });

      // Hover over retry button to show tooltip
      const assistantMessage = page.getByTestId("assistant-message");
      const retryButton = assistantMessage.locator('[aria-label="Try again"]');

      await retryButton.hover();

      // Wait for tooltip to appear
      await page.waitForTimeout(500);

      // Tooltip should show "Try again"
      await expect(page.getByRole("tooltip")).toContainText("Try again");

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Retry Button Behavior", () => {
    test("should regenerate assistant response when clicking retry", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Send a message
      await page.getByTestId("message-input").fill("What is 2 + 2?");
      await page.getByTestId("send-button").click();

      // Wait for redirect
      await page.waitForURL(/\/chat\/[a-zA-Z0-9-]+/, { timeout: 10000 });

      // Wait for first response to complete
      await expect(page.getByTestId("assistant-message")).toBeVisible({
        timeout: 30000,
      });
      await expect(page.getByTestId("send-button")).toBeEnabled({
        timeout: 30000,
      });

      // Click retry
      const retryButton = page.locator('[aria-label="Try again"]').last();
      await retryButton.click();

      // Wait for streaming to complete (send button becomes enabled again)
      await expect(page.getByTestId("send-button")).toBeEnabled({
        timeout: 30000,
      });

      // Response should still be visible (may have same or different content)
      await expect(page.getByTestId("assistant-message")).toBeVisible();

      consoleMonitor.assertNoErrors();
    });

    test("should maintain message count after retry", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Send a message
      await page.getByTestId("message-input").fill("Hello there");
      await page.getByTestId("send-button").click();

      // Wait for redirect
      await page.waitForURL(/\/chat\/[a-zA-Z0-9-]+/, { timeout: 10000 });

      // Wait for response
      await expect(page.getByTestId("send-button")).toBeEnabled({
        timeout: 30000,
      });

      // Count initial messages
      const initialUserCount = await page.getByTestId("user-message").count();
      const initialAssistantCount = await page
        .getByTestId("assistant-message")
        .count();

      expect(initialUserCount).toBe(1);
      expect(initialAssistantCount).toBe(1);

      // Click retry
      const retryButton = page.locator('[aria-label="Try again"]').last();
      await retryButton.click();

      // Wait for new response
      await expect(page.getByTestId("send-button")).toBeEnabled({
        timeout: 30000,
      });

      // Should still have same number of messages (retry replaces, not adds)
      const finalUserCount = await page.getByTestId("user-message").count();
      const finalAssistantCount = await page
        .getByTestId("assistant-message")
        .count();

      expect(finalUserCount).toBe(1);
      expect(finalAssistantCount).toBe(1);

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Retry with Multiple Messages", () => {
    test("should show retry button on each assistant message", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Send first message
      await page.getByTestId("message-input").fill("First question");
      await page.getByTestId("send-button").click();

      // Wait for redirect
      await page.waitForURL(/\/chat\/[a-zA-Z0-9-]+/, { timeout: 10000 });

      // Wait for response
      await expect(page.getByTestId("send-button")).toBeEnabled({
        timeout: 30000,
      });

      // Send second message
      await page.getByTestId("message-input").fill("Second question");
      await page.getByTestId("send-button").click();

      // Wait for response
      await expect(page.getByTestId("send-button")).toBeEnabled({
        timeout: 30000,
      });

      // Should have 2 user messages and 2 assistant messages
      await expect(page.getByTestId("user-message")).toHaveCount(2);
      await expect(page.getByTestId("assistant-message")).toHaveCount(2);

      // Each assistant message should have a retry button
      const retryButtons = page.locator('[aria-label="Try again"]');
      expect(await retryButtons.count()).toBe(2);

      consoleMonitor.assertNoErrors();
    });
  });
});
