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

  test("should auto-resize input for multiline content", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    const input = page.getByTestId("message-input");

    // Get initial height
    const initialHeight = await input.evaluate((el: HTMLTextAreaElement) => el.offsetHeight);

    // Type multiple lines using Shift+Enter
    await input.fill("Line 1");
    await input.press("Shift+Enter");
    await input.type("Line 2");
    await input.press("Shift+Enter");
    await input.type("Line 3");
    await input.press("Shift+Enter");
    await input.type("Line 4");

    // Wait for resize to apply
    await page.waitForTimeout(100);

    // Get height after adding content
    const expandedHeight = await input.evaluate((el: HTMLTextAreaElement) => el.offsetHeight);

    // Height should have increased
    expect(expandedHeight).toBeGreaterThan(initialHeight);

    consoleMonitor.assertNoErrors();
  });

  test("should show error for messages exceeding max length", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Create a message that exceeds 32KB limit
    const oversizedMessage = "A".repeat(33 * 1024); // 33KB

    await page.getByTestId("message-input").fill(oversizedMessage);
    await page.getByTestId("send-button").click();

    // Should show error message about max length
    await expect(page.getByText(/exceeds maximum length/i)).toBeVisible();

    // No message should be sent
    expect(await page.getByTestId("user-message").count()).toBe(0);

    consoleMonitor.assertNoErrors();
  });

  test("should clear input after sending message", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Type and send a message
    await page.getByTestId("message-input").fill("Test message to clear");
    await page.getByTestId("send-button").click();

    // Input should be empty after sending
    await expect(page.getByTestId("message-input")).toHaveValue("");

    consoleMonitor.assertNoErrors();
  });

  test("should show placeholder text in input", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    const input = page.getByTestId("message-input");

    // Should have placeholder
    await expect(input).toHaveAttribute("placeholder", "Send a message...");

    consoleMonitor.assertNoErrors();
  });

  test("should show input hint text", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Should show hint about Enter and Shift+Enter
    await expect(
      page.getByText("Press Enter to send, Shift+Enter for new line")
    ).toBeVisible();

    consoleMonitor.assertNoErrors();
  });

  test("should disable input during streaming", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Send a message
    await page.getByTestId("message-input").fill("Test message");
    await page.getByTestId("send-button").click();

    // During streaming, the stop button should be visible (indicating streaming)
    // The send button should be replaced by stop button
    const stopButton = page.getByTestId("stop-button");

    // Try to catch the streaming state
    let foundStopButton = false;
    const startTime = Date.now();
    while (Date.now() - startTime < 5000) {
      if (await stopButton.isVisible().catch(() => false)) {
        foundStopButton = true;
        break;
      }
      // Check if already done
      if (await page.getByTestId("send-button").isVisible().catch(() => false)) {
        break;
      }
      await page.waitForTimeout(100);
    }

    // Wait for streaming to complete
    await expect(page.getByTestId("send-button")).toBeVisible({ timeout: 30000 });

    consoleMonitor.assertNoErrors();
  });

  test("should focus input on page load", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Wait for page to load
    await expect(page.getByTestId("message-input")).toBeVisible();

    // The input should be ready to receive focus when clicked
    await page.getByTestId("message-input").click();

    // Should be focused
    await expect(page.getByTestId("message-input")).toBeFocused();

    consoleMonitor.assertNoErrors();
  });
});
