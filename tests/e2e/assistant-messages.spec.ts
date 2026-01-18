import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Assistant Messages", () => {
  test.beforeEach(async ({ context }) => {
    await login(context, {
      email: "assistant-messages-test@example.com",
      name: "Assistant Messages Test User",
    });
  });

  test("should display user message with copy button", async ({
    page,
  }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Send a message
    await page.getByTestId("message-input").fill("Hello");
    await page.getByTestId("send-button").click();

    // Wait for user message to appear
    await expect(page.getByTestId("user-message")).toBeVisible();

    // User message should have a copy button
    const copyButton = page.getByTestId("user-message").locator('[aria-label="Copy message"]');
    await expect(copyButton).toBeVisible();

    // Wait for response to complete (or timeout)
    await expect(page.getByTestId("send-button")).toBeVisible({
      timeout: 30000,
    });

    consoleMonitor.assertNoErrors();
  });

  test("should copy user message to clipboard", async ({ page, context }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.goto("/chat");

    const testMessage = "Test message for clipboard";
    await page.getByTestId("message-input").fill(testMessage);
    await page.getByTestId("send-button").click();

    // Wait for user message to appear
    await expect(page.getByTestId("user-message")).toBeVisible();

    // Wait for streaming to complete (so we have stable state)
    await expect(page.getByTestId("send-button")).toBeVisible({
      timeout: 30000,
    });

    // Click the first copy button (user message)
    const copyButton = page.locator('[aria-label="Copy message"]').first();
    await copyButton.click();

    // Check clipboard
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboardText).toBe(testMessage);

    consoleMonitor.assertNoErrors();
  });

  test("should complete send message flow without errors", async ({
    page,
  }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Send a message
    await page.getByTestId("message-input").fill("Hello");
    await page.getByTestId("send-button").click();

    // Verify user message appears
    await expect(page.getByTestId("user-message")).toBeVisible();
    await expect(page.getByTestId("user-message")).toContainText("Hello");

    // Wait for streaming to complete (send button returns)
    await expect(page.getByTestId("send-button")).toBeVisible({
      timeout: 30000,
    });

    // Input should be cleared after sending
    await expect(page.getByTestId("message-input")).toHaveValue("");

    consoleMonitor.assertNoErrors();
  });

  test("should show user message with You label", async ({
    page,
  }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Send a message
    await page.getByTestId("message-input").fill("Hi");
    await page.getByTestId("send-button").click();

    // User message should appear with "You" label
    const userMessage = page.getByTestId("user-message");
    await expect(userMessage).toBeVisible();
    await expect(userMessage).toContainText("You");
    await expect(userMessage).toContainText("Hi");

    // Wait for streaming to complete (or error)
    await expect(page.getByTestId("send-button")).toBeVisible({
      timeout: 30000,
    });

    consoleMonitor.assertNoErrors();
  });

  test("should show multiple user messages in conversation", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Send first message
    await page.getByTestId("message-input").fill("First message");
    await page.getByTestId("send-button").click();

    // Wait for first user message to appear
    await expect(page.getByTestId("user-message")).toBeVisible();
    await expect(page.getByTestId("user-message")).toContainText("First message");

    // Wait for response to complete before sending second message
    await expect(page.getByTestId("send-button")).toBeVisible({
      timeout: 30000,
    });

    // Ensure input is ready for next message
    await expect(page.getByTestId("message-input")).toBeEnabled();

    // Send second message
    await page.getByTestId("message-input").fill("Second message");
    await page.getByTestId("send-button").click();

    // Wait for second user message with polling for reliability
    await expect(async () => {
      const userMessages = page.getByTestId("user-message");
      const count = await userMessages.count();
      expect(count).toBe(2);
    }).toPass({ timeout: 15000 });

    // Verify both messages are visible
    await expect(page.getByText("First message")).toBeVisible();
    await expect(page.getByText("Second message")).toBeVisible();

    // Wait for streaming to complete
    await expect(page.getByTestId("send-button")).toBeVisible({
      timeout: 30000,
    });

    consoleMonitor.assertNoErrors();
  });
});
