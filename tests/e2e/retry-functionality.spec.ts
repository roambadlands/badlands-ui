import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Retry Functionality", () => {
  // Each test gets a unique email to ensure clean state
  test.beforeEach(async ({ context }, testInfo) => {
    const uniqueEmail = `retry-test-${Date.now()}-${testInfo.testId}@example.com`;
    await login(context, {
      email: uniqueEmail,
      name: "Retry Test User",
    });
  });

  test("should NOT show retry button on user messages", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Send a message
    await page.getByTestId("message-input").fill("Hi");
    await page.getByTestId("send-button").click();

    // Wait for user message to appear
    await expect(page.getByTestId("user-message")).toBeVisible();

    // Check that retry button is NOT on user message
    const userMessage = page.getByTestId("user-message");
    const retryButton = userMessage.locator('[aria-label="Try again"]');

    expect(await retryButton.count()).toBe(0);

    consoleMonitor.assertNoErrors();
  });

  test("should have copy button on user message", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Send a message
    await page.getByTestId("message-input").fill("Test message");
    await page.getByTestId("send-button").click();

    // Wait for user message to appear
    const userMessage = page.getByTestId("user-message");
    await expect(userMessage).toBeVisible();

    // User message should have copy button
    const copyButton = userMessage.locator('[aria-label="Copy message"]');
    await expect(copyButton).toBeVisible();

    consoleMonitor.assertNoErrors();
  });
});
