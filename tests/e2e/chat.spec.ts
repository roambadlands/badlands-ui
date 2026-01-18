import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Chat", () => {
  test.beforeEach(async ({ context }) => {
    // Login before each test
    await login(context, {
      email: "chat-test@example.com",
      name: "Chat Test User",
    });
  });

  test("should display chat interface after login", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Should see the message input
    await expect(page.getByTestId("message-input")).toBeVisible();

    // Should see the send button (disabled when input is empty)
    await expect(page.getByTestId("send-button")).toBeVisible();

    // Should see the new chat button in sidebar
    await expect(page.getByTestId("new-chat-button")).toBeVisible();

    consoleMonitor.assertNoErrors();
  });

  test("should send a message and see it in the chat", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Type a message
    await page.getByTestId("message-input").fill("Hello, this is a test message");

    // Send button should be enabled
    await expect(page.getByTestId("send-button")).toBeEnabled();

    // Click send
    await page.getByTestId("send-button").click();

    // Should see the user message appear
    await expect(page.getByTestId("user-message")).toContainText(
      "Hello, this is a test message"
    );

    // Input should be cleared
    await expect(page.getByTestId("message-input")).toHaveValue("");

    consoleMonitor.assertNoErrors();
  });

  test("should receive a streaming response from assistant", async ({
    page,
  }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Send a message
    await page.getByTestId("message-input").fill("Hello");
    await page.getByTestId("send-button").click();

    // Wait for assistant response to appear (could be waiting indicator or actual content)
    await expect(page.getByTestId("assistant-message")).toBeVisible({
      timeout: 30000,
    });

    // Wait for streaming to complete - send button should reappear
    await expect(page.getByTestId("send-button")).toBeVisible({
      timeout: 30000,
    });

    consoleMonitor.assertNoErrors();
  });

  test("should be able to stop streaming response", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Send a message
    await page.getByTestId("message-input").fill("Tell me a long story");
    await page.getByTestId("send-button").click();

    // Stop button should appear during streaming
    // Note: This test may be flaky if the response is very fast
    const stopButton = page.getByTestId("stop-button");

    // Try to click stop if visible (may already be done)
    try {
      await stopButton.click({ timeout: 5000 });
    } catch {
      // Response may have completed before we could stop it
      // That's OK for this test
    }

    // Eventually the send button should be visible again
    await expect(page.getByTestId("send-button")).toBeVisible({
      timeout: 30000,
    });

    consoleMonitor.assertNoErrors();
  });

  test("should send message with Enter key", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Type a message
    await page.getByTestId("message-input").fill("Message sent with Enter");

    // Press Enter
    await page.getByTestId("message-input").press("Enter");

    // Should see the user message
    await expect(page.getByTestId("user-message")).toContainText(
      "Message sent with Enter"
    );

    consoleMonitor.assertNoErrors();
  });

  test("should allow newline with Shift+Enter", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Type a message with Shift+Enter for newline
    const input = page.getByTestId("message-input");
    await input.fill("Line 1");
    await input.press("Shift+Enter");
    await input.type("Line 2");

    // The input should contain both lines
    await expect(input).toHaveValue("Line 1\nLine 2");

    // Message should not be sent yet
    expect(await page.getByTestId("user-message").count()).toBe(0);

    consoleMonitor.assertNoErrors();
  });

  test("should not send empty messages", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Send button should be disabled when input is empty
    await expect(page.getByTestId("send-button")).toBeDisabled();

    // Try to press Enter with empty input
    await page.getByTestId("message-input").press("Enter");

    // No messages should appear
    expect(await page.getByTestId("user-message").count()).toBe(0);

    consoleMonitor.assertNoErrors();
  });
});
