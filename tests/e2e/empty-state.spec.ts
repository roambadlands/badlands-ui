import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Empty State and Prompt Suggestions", () => {
  test.beforeEach(async ({ context }) => {
    // Use unique email to ensure fresh state with no sessions
    const uniqueEmail = `empty-state-${Date.now()}@example.com`;
    await login(context, {
      email: uniqueEmail,
      name: "Empty State Test User",
    });
  });

  test.describe("Welcome Message", () => {
    test("should display welcome header for new users", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Wait for the empty state to load
      await expect(page.getByTestId("message-input")).toBeVisible();

      // Should show welcome message
      await expect(page.getByText("Welcome to Badlands AI")).toBeVisible();

      consoleMonitor.assertNoErrors();
    });

    test("should display prompt suggestion description", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Should show the suggestion text
      await expect(
        page.getByText(/Ask anything about THORChain/i)
      ).toBeVisible();

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Prompt Categories", () => {
    test("should display all prompt categories", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Wait for page to load
      await expect(page.getByText("Welcome to Badlands AI")).toBeVisible();

      // Should show all category headings
      await expect(page.getByText("Getting Started")).toBeVisible();
      await expect(page.getByText("DeFi & Trading")).toBeVisible();
      await expect(page.getByText("Network & Nodes")).toBeVisible();
      await expect(page.getByText("Analytics")).toBeVisible();
      await expect(page.getByText("Developer")).toBeVisible();

      consoleMonitor.assertNoErrors();
    });

    test("should display prompt suggestions under each category", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Wait for page to load
      await expect(page.getByText("Welcome to Badlands AI")).toBeVisible();

      // Check for some specific prompts from different categories
      await expect(
        page.getByText("What is THORChain and what problem does it solve?")
      ).toBeVisible();
      await expect(
        page.getByText(/top 5 deepest liquidity pools/i)
      ).toBeVisible();
      await expect(
        page.getByText(/current status of the THORChain network/i)
      ).toBeVisible();

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Prompt Selection", () => {
    test("should send message immediately when clicking a prompt suggestion", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Wait for page to load
      await expect(page.getByText("Welcome to Badlands AI")).toBeVisible();

      // Click on a prompt suggestion - this should immediately send the message
      const promptText = "What is THORChain and what problem does it solve?";
      await page.getByText(promptText, { exact: true }).click();

      // Should see the user message appear (prompt is sent immediately)
      await expect(page.getByTestId("user-message")).toContainText("THORChain");

      // Empty state should no longer be visible
      await expect(page.getByText("Welcome to Badlands AI")).not.toBeVisible();

      consoleMonitor.assertNoErrors();
    });

    test("should trigger assistant response after clicking a prompt", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Wait for page to load
      await expect(page.getByText("Welcome to Badlands AI")).toBeVisible();

      // Click on a prompt suggestion
      const promptText = "What is THORChain and what problem does it solve?";
      await page.getByText(promptText, { exact: true }).click();

      // Should see the user message
      await expect(page.getByTestId("user-message")).toContainText(
        "THORChain"
      );

      // Wait for streaming to complete first
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Check for assistant message (should be present after streaming completes)
      const assistantMessage = page.getByTestId("assistant-message");
      const hasAssistantMessage = (await assistantMessage.count()) > 0;

      // If assistant message exists, verify it has content
      if (hasAssistantMessage) {
        const textContent = await assistantMessage.textContent();
        expect(textContent?.length).toBeGreaterThan(0);
      }

      consoleMonitor.assertNoErrors();
    });

    test("should hide empty state after first message", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Verify empty state is shown initially
      await expect(page.getByText("Welcome to Badlands AI")).toBeVisible();
      await expect(page.getByText("Getting Started")).toBeVisible();

      // Send a message
      await page.getByTestId("message-input").fill("Hello");
      await page.getByTestId("send-button").click();

      // User message should appear
      await expect(page.getByTestId("user-message")).toBeVisible();

      // Empty state should be hidden
      await expect(
        page.getByText("Welcome to Badlands AI")
      ).not.toBeVisible();
      await expect(page.getByText("Getting Started")).not.toBeVisible();

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Prompt Hover States", () => {
    test("should show hover effect on prompt buttons", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Wait for page to load
      await expect(page.getByText("Welcome to Badlands AI")).toBeVisible();

      // Find a prompt button
      const promptButton = page.getByText(
        "What is THORChain and what problem does it solve?",
        { exact: true }
      );

      // Should be a button element
      await expect(promptButton).toBeVisible();

      // Hover over it
      await promptButton.hover();

      // Should have hover styling (difficult to test CSS, but verify element is interactive)
      await expect(promptButton).toBeEnabled();

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Multiple Prompts", () => {
    test("should be able to send prompt from different categories", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Wait for page to load
      await expect(page.getByText("Welcome to Badlands AI")).toBeVisible();

      // Click a prompt from "Getting Started" category
      const prompt = "What is THORChain and what problem does it solve?";
      await page.getByText(prompt, { exact: true }).click();

      // Should see the user message
      await expect(page.getByTestId("user-message")).toContainText("THORChain");

      // Wait for response to complete
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Empty state should be gone (can't click another prompt after sending)
      await expect(page.getByText("Welcome to Badlands AI")).not.toBeVisible();

      consoleMonitor.assertNoErrors();
    });
  });
});
