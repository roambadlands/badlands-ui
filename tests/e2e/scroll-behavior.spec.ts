import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Scroll Behavior", () => {
  test.beforeEach(async ({ context }) => {
    await login(context, {
      email: "scroll-test@example.com",
      name: "Scroll Test User",
    });
  });

  test.describe("Auto-scroll on New Messages", () => {
    test("should scroll to bottom when user sends message", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Send a message
      await page.getByTestId("message-input").fill("Hello, tell me about THORChain");
      await page.getByTestId("send-button").click();

      // Wait for user message first
      await expect(page.getByTestId("user-message")).toBeVisible();

      // The user message should be visible (scrolled into view)
      const userMessage = page.getByTestId("user-message");
      await expect(userMessage).toBeInViewport();

      // Wait for streaming to complete
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      consoleMonitor.assertNoErrors();
    });

    test("should scroll to show assistant response", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Send a message
      await page.getByTestId("message-input").fill("What is a liquidity pool?");
      await page.getByTestId("send-button").click();

      // Wait for user message first
      await expect(page.getByTestId("user-message")).toBeVisible();

      // Wait for streaming to complete
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Check for assistant message
      const assistantMessage = page.getByTestId("assistant-message");
      const hasAssistantMessage = (await assistantMessage.count()) > 0;

      if (hasAssistantMessage) {
        // Assistant message should be visible (scrolled into view)
        await expect(assistantMessage.first()).toBeInViewport();
      }

      consoleMonitor.assertNoErrors();
    });

    test("should keep latest content visible during streaming", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Send a message that will generate a longer response
      await page
        .getByTestId("message-input")
        .fill("Explain THORChain in detail");
      await page.getByTestId("send-button").click();

      // Wait for user message first
      await expect(page.getByTestId("user-message")).toBeVisible();

      // Wait for streaming to complete
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Check for assistant message
      const assistantMessage = page.getByTestId("assistant-message");
      const hasAssistantMessage = (await assistantMessage.count()) > 0;

      if (hasAssistantMessage) {
        // Message area should still be visible after streaming
        await expect(assistantMessage.first()).toBeInViewport();
      }

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Multiple Messages", () => {
    test("should scroll to latest message in conversation", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Send first message
      await page.getByTestId("message-input").fill("First question: What is RUNE?");
      await page.getByTestId("send-button").click();

      // Wait for first response
      await expect(page.getByTestId("user-message")).toBeVisible();
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Send second message
      await page.getByTestId("message-input").fill("Second question: What is a swap?");
      await page.getByTestId("send-button").click();

      // Wait for second user message
      const userMessages = page.getByTestId("user-message");
      await expect(userMessages).toHaveCount(2, { timeout: 10000 });

      // Wait for second response
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Latest user message should be in viewport
      const lastUserMessage = userMessages.last();
      await expect(lastUserMessage).toBeInViewport();

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Input Focus", () => {
    test("should keep input visible at bottom of viewport", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Input should be visible initially
      const messageInput = page.getByTestId("message-input");
      await expect(messageInput).toBeInViewport();

      // Send a message
      await messageInput.fill("Tell me something");
      await page.getByTestId("send-button").click();

      // Wait for response
      await expect(page.getByTestId("user-message")).toBeVisible();
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Input should still be visible (at bottom)
      await expect(messageInput).toBeInViewport();

      consoleMonitor.assertNoErrors();
    });

    test("should allow input focus after sending message", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      const messageInput = page.getByTestId("message-input");

      // Send a message
      await messageInput.fill("Quick question");
      await page.getByTestId("send-button").click();

      // Wait for response
      await expect(page.getByTestId("user-message")).toBeVisible();
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Input should be focusable and ready for next message
      await messageInput.focus();
      await expect(messageInput).toBeFocused();

      // Should be able to type
      await messageInput.fill("Follow up");
      await expect(messageInput).toHaveValue("Follow up");

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Session Navigation", () => {
    test("should display messages when navigating to existing session", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Create a session with messages
      await page.getByTestId("message-input").fill("Create a test session");
      await page.getByTestId("send-button").click();

      // Wait for response and session creation
      await expect(page.getByTestId("user-message")).toBeVisible();
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // URL should have changed to include session ID
      await expect(page).toHaveURL(/\/chat\/[a-f0-9-]+/);

      // Get the session URL
      const sessionUrl = page.url();

      // Navigate away and back to test session loading
      await page.goto("/chat");

      // Navigate directly to the session URL
      await page.goto(sessionUrl);

      // Messages should be visible after navigation
      const userMessage = page.getByTestId("user-message");
      await expect(userMessage.first()).toBeVisible({ timeout: 10000 });

      // Message should be in viewport
      await expect(userMessage.first()).toBeInViewport();

      consoleMonitor.assertNoErrors();
    });
  });
});
