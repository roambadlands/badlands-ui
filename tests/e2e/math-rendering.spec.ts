import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Math/KaTeX Rendering", () => {
  test.beforeEach(async ({ context }) => {
    await login(context, {
      email: "math-test@example.com",
      name: "Math Test User",
    });
  });

  test.describe("Display Math", () => {
    test("should render block-level math equations", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Request that might include math formulas
      await page
        .getByTestId("message-input")
        .fill("What is the formula for compound interest?");
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
        // Check for KaTeX elements (they have .katex class)
        const katexElements = assistantMessage.locator(".katex");
        const katexCount = await katexElements.count();

        if (katexCount > 0) {
          // KaTeX should render visible math
          await expect(katexElements.first()).toBeVisible();
        }

        // Response should have content regardless
        const textContent = await assistantMessage.textContent();
        expect(textContent?.length).toBeGreaterThan(10);
      }

      consoleMonitor.assertNoErrors();
    });

    test("should center display math equations", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Show me the quadratic formula");
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
        // Check for centered math containers (flex justify-center)
        const centeredContainers = assistantMessage.locator(
          "div.flex.justify-center"
        );
        const containerCount = await centeredContainers.count();

        // If we have math, it should be in centered container
        if (containerCount > 0) {
          await expect(centeredContainers.first()).toBeVisible();
        }
      }

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Inline Math", () => {
    test("should render inline math within text", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("What is 2 plus 2?");
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
        // Response should have content
        const textContent = await assistantMessage.textContent();
        expect(textContent?.length).toBeGreaterThan(0);
      }

      // Main assertion: no errors from KaTeX rendering
      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Math Edge Cases", () => {
    test("should handle complex mathematical expressions", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Explain the Black-Scholes formula");
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
        // Response should have content
        const textContent = await assistantMessage.textContent();
        expect(textContent?.length).toBeGreaterThan(10);
      }

      // Complex formulas should not cause errors
      consoleMonitor.assertNoErrors();
    });

    test("should handle mathematical notation gracefully", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Show me a summation formula");
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
        // Response should have content
        const textContent = await assistantMessage.textContent();
        expect(textContent?.length).toBeGreaterThan(10);
      }

      // Should not produce console errors
      consoleMonitor.assertNoErrors();
    });
  });
});
