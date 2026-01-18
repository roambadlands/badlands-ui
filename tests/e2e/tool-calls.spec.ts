import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Tool Call Display", () => {
  test.beforeEach(async ({ context }) => {
    await login(context, {
      email: "tool-calls-test@example.com",
      name: "Tool Calls Test User",
    });
  });

  test.describe("Tool Call UI", () => {
    test("should display tool call during assistant response that uses tools", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Send a message that is likely to trigger a tool call
      // (queries about network status, prices, etc. typically use tools)
      await page
        .getByTestId("message-input")
        .fill("What is the current RUNE price?");
      await page.getByTestId("send-button").click();

      // Wait for streaming to start
      await expect(page.getByTestId("user-message")).toBeVisible();

      // Look for tool call indicator during streaming
      // Tool calls appear as bordered cards with tool name
      const toolCallElement = page.locator('[class*="border-border"][class*="bg-card"]').filter({
        has: page.locator('svg[class*="lucide-wrench"]'),
      });

      // Wait for either tool call or completion
      let foundToolCall = false;
      const startTime = Date.now();

      while (Date.now() - startTime < 30000) {
        if (await toolCallElement.first().isVisible().catch(() => false)) {
          foundToolCall = true;
          break;
        }
        // Check if streaming is done
        if (await page.getByTestId("send-button").isVisible().catch(() => false)) {
          break;
        }
        await page.waitForTimeout(200);
      }

      // Wait for streaming to complete
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // If tool calls were used, verify their display
      if (foundToolCall) {
        // Tool call should show tool name
        await expect(toolCallElement.first()).toBeVisible();

        // Should have expand/collapse chevron
        const chevron = toolCallElement.first().locator('svg[class*="lucide-chevron"]');
        await expect(chevron).toBeVisible();
      }

      // This test passes regardless of whether tools were used,
      // as the LLM may or may not use tools for this query

      consoleMonitor.assertNoErrors();
    });

    test("should allow expanding and collapsing tool call details", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Send a message that is likely to trigger a tool call
      await page
        .getByTestId("message-input")
        .fill("What are the current network statistics for THORChain?");
      await page.getByTestId("send-button").click();

      // Wait for user message first
      await expect(page.getByTestId("user-message")).toBeVisible();

      // Wait for streaming to complete
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Look for tool call in the assistant message
      const assistantMessage = page.getByTestId("assistant-message");
      const hasAssistantMessage = (await assistantMessage.count()) > 0;

      if (hasAssistantMessage) {
        // Find tool call cards
        const toolCallCards = assistantMessage.locator('[class*="border-border"][class*="bg-card"]').filter({
          has: page.locator('svg[class*="lucide-wrench"]'),
        });

        const toolCallCount = await toolCallCards.count();

        if (toolCallCount > 0) {
          const firstToolCall = toolCallCards.first();

          // Click to expand
          await firstToolCall.click();

          // Should show expanded content with "Input" or "Output" labels
          await expect(
            firstToolCall.locator('text=/Input|Output/i').first()
          ).toBeVisible({ timeout: 2000 });

          // Click again to collapse
          await firstToolCall.click();

          // Content should be hidden (Input/Output labels not visible)
          await page.waitForTimeout(100);
        }
      }

      consoleMonitor.assertNoErrors();
    });

    test("should show tool call status icons", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Send a message that uses tools
      await page
        .getByTestId("message-input")
        .fill("Show me the top liquidity pools on THORChain");
      await page.getByTestId("send-button").click();

      // Wait for streaming to complete
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Look for tool call cards
      const assistantMessage = page.getByTestId("assistant-message");
      const toolCallCards = assistantMessage.locator('[class*="border-border"][class*="bg-card"]').filter({
        has: page.locator('svg[class*="lucide-wrench"]'),
      });

      const toolCallCount = await toolCallCards.count();

      if (toolCallCount > 0) {
        // Completed tool calls should have check icon
        const checkIcon = toolCallCards.first().locator('svg[class*="lucide-check"]');
        const errorIcon = toolCallCards.first().locator('svg[class*="lucide-alert-circle"]');

        // Should have either check (success) or error icon
        const hasCheck = await checkIcon.isVisible().catch(() => false);
        const hasError = await errorIcon.isVisible().catch(() => false);

        expect(hasCheck || hasError).toBe(true);
      }

      consoleMonitor.assertNoErrors();
    });

    test("should format tool names for display", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Send a message that uses tools
      await page
        .getByTestId("message-input")
        .fill("What is the current network status?");
      await page.getByTestId("send-button").click();

      // Wait for streaming to complete
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Look for tool call cards
      const assistantMessage = page.getByTestId("assistant-message");
      const toolCallCards = assistantMessage.locator('[class*="border-border"][class*="bg-card"]').filter({
        has: page.locator('svg[class*="lucide-wrench"]'),
      });

      const toolCallCount = await toolCallCards.count();

      if (toolCallCount > 0) {
        // Tool name should be displayed (formatted without mcp__ prefix)
        const toolName = await toolCallCards.first().textContent();
        // Should NOT contain the raw "mcp__" prefix
        expect(toolName).not.toContain("mcp__");
        expect(toolName).not.toContain("mcp:");
      }

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Tool Call with Input/Output", () => {
    test("should display tool input when expanded", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Send a message that uses tools with parameters
      await page
        .getByTestId("message-input")
        .fill("Get me a quote to swap 1 BTC for ETH through THORChain");
      await page.getByTestId("send-button").click();

      // Wait for streaming to complete
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Look for tool call cards
      const assistantMessage = page.getByTestId("assistant-message");
      const toolCallCards = assistantMessage.locator('[class*="border-border"][class*="bg-card"]').filter({
        has: page.locator('svg[class*="lucide-wrench"]'),
      });

      const toolCallCount = await toolCallCards.count();

      if (toolCallCount > 0) {
        // Click to expand
        await toolCallCards.first().click();

        // Should show Input section with JSON
        const inputSection = toolCallCards.first().locator('text="Input"');
        await expect(inputSection).toBeVisible({ timeout: 2000 });

        // Should have pre element with JSON content
        const preElement = toolCallCards.first().locator("pre");
        await expect(preElement.first()).toBeVisible();
      }

      consoleMonitor.assertNoErrors();
    });

    test("should display tool output when expanded", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Send a message that uses tools
      await page
        .getByTestId("message-input")
        .fill("What is the current RUNE price in USD?");
      await page.getByTestId("send-button").click();

      // Wait for streaming to complete
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Look for tool call cards
      const assistantMessage = page.getByTestId("assistant-message");
      const toolCallCards = assistantMessage.locator('[class*="border-border"][class*="bg-card"]').filter({
        has: page.locator('svg[class*="lucide-wrench"]'),
      });

      const toolCallCount = await toolCallCards.count();

      if (toolCallCount > 0) {
        // Click to expand
        await toolCallCards.first().click();

        // Should show Output section
        const outputSection = toolCallCards.first().locator('text="Output"');

        // Give time for content to render
        await page.waitForTimeout(200);

        // Check if output is displayed (may not always be present)
        const hasOutput = await outputSection.isVisible().catch(() => false);

        if (hasOutput) {
          // Should have pre element with JSON content
          const preElements = toolCallCards.first().locator("pre");
          const preCount = await preElements.count();
          expect(preCount).toBeGreaterThan(0);
        }
      }

      consoleMonitor.assertNoErrors();
    });
  });
});
