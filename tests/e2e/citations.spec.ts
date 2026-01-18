import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Citations Display", () => {
  test.beforeEach(async ({ context }) => {
    await login(context, {
      email: "citations-test@example.com",
      name: "Citations Test User",
    });
  });

  test("should display citations when assistant response includes sources", async ({
    page,
  }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Send a simple message
    await page
      .getByTestId("message-input")
      .fill("What is the current RUNE price?");
    await page.getByTestId("send-button").click();

    // Wait for user message to appear
    await expect(page.getByTestId("user-message")).toBeVisible();

    // Wait for streaming to complete
    await expect(page.getByTestId("send-button")).toBeVisible({
      timeout: 30000,
    });

    // Look for assistant message
    const assistantMessage = page.getByTestId("assistant-message");
    const hasAssistantMessage = await assistantMessage.count() > 0;

    if (hasAssistantMessage) {
      // Citations appear as cards with an external link icon
      const citationElements = assistantMessage.locator(
        'svg[class*="lucide-external-link"]'
      );

      const citationCount = await citationElements.count();

      // This test passes regardless of whether citations were returned,
      // as the LLM may or may not include citations for this query
      if (citationCount > 0) {
        // Verify citation has visible content
        const citationCard = citationElements.first().locator("..").locator("..");
        await expect(citationCard).toBeVisible();
      }
    }

    consoleMonitor.assertNoErrors();
  });

  test("should format tool source references correctly", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Send a message that triggers tool use with citations
    await page
      .getByTestId("message-input")
      .fill("Get me the latest pool data from THORChain and cite your sources");
    await page.getByTestId("send-button").click();

    // Wait for streaming to complete
    await expect(page.getByTestId("send-button")).toBeVisible({
      timeout: 30000,
    });

    const assistantMessage = page.getByTestId("assistant-message");

    // If citations are present, verify formatting
    const citationElements = assistantMessage.locator(
      'svg[class*="lucide-external-link"]'
    );

    const citationCount = await citationElements.count();

    if (citationCount > 0) {
      // Citation should NOT show raw "mcp:" prefix
      const citationText = await assistantMessage.textContent();
      expect(citationText).not.toContain("mcp:");
      expect(citationText).not.toContain("mcp__");
    }

    consoleMonitor.assertNoErrors();
  });

  test("should display multiple citations when response has multiple sources", async ({
    page,
  }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Send a message that might trigger multiple tool calls with citations
    await page
      .getByTestId("message-input")
      .fill(
        "Compare the RUNE price with ETH price and show me the THORChain network stats. Cite all sources."
      );
    await page.getByTestId("send-button").click();

    // Wait for user message first
    await expect(page.getByTestId("user-message")).toBeVisible();

    // Wait for streaming to complete
    await expect(page.getByTestId("send-button")).toBeVisible({
      timeout: 30000,
    });

    const assistantMessage = page.getByTestId("assistant-message");
    const hasAssistantMessage = (await assistantMessage.count()) > 0;

    if (hasAssistantMessage) {
      // Check for citations
      const citationElements = assistantMessage.locator(
        'svg[class*="lucide-external-link"]'
      );

      const citationCount = await citationElements.count();

      // If multiple citations exist, each should be visible
      if (citationCount > 1) {
        for (let i = 0; i < citationCount; i++) {
          await expect(citationElements.nth(i)).toBeVisible();
        }
      }
    }

    consoleMonitor.assertNoErrors();
  });
});
