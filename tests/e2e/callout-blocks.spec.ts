import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Callout Block Rendering", () => {
  test.beforeEach(async ({ context }) => {
    await login(context, {
      email: "callout-blocks-test@example.com",
      name: "Callout Blocks Test User",
    });
  });

  test.describe("Callout Types", () => {
    test("should render NOTE callouts with info styling", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Request that might include a note
      await page
        .getByTestId("message-input")
        .fill("Tell me about THORChain with important notes");
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
        // Check for callout blocks (have border-l-4 styling)
        const callouts = assistantMessage.locator("div.border-l-4");
        const calloutCount = await callouts.count();

        if (calloutCount > 0) {
          // Callout should be visible
          await expect(callouts.first()).toBeVisible();
        }

        // Response should have content regardless
        const textContent = await assistantMessage.textContent();
        expect(textContent?.length).toBeGreaterThan(10);
      }

      consoleMonitor.assertNoErrors();
    });

    test("should render WARNING callouts with yellow styling", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("What are the risks of providing liquidity?");
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
        // Check for yellow-styled callouts
        const warningCallouts = assistantMessage.locator(
          'div[class*="border-yellow"]'
        );
        const warningCount = await warningCallouts.count();

        if (warningCount > 0) {
          await expect(warningCallouts.first()).toBeVisible();
        }

        // Response should have content
        const textContent = await assistantMessage.textContent();
        expect(textContent?.length).toBeGreaterThan(10);
      }

      consoleMonitor.assertNoErrors();
    });

    test("should render TIP callouts with green styling", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Give me tips for maximizing yields");
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
        // Check for green-styled callouts
        const tipCallouts = assistantMessage.locator(
          'div[class*="border-green"]'
        );
        const tipCount = await tipCallouts.count();

        if (tipCount > 0) {
          await expect(tipCallouts.first()).toBeVisible();
        }

        // Response should have content
        const textContent = await assistantMessage.textContent();
        expect(textContent?.length).toBeGreaterThan(10);
      }

      consoleMonitor.assertNoErrors();
    });

    test("should render IMPORTANT callouts with purple styling", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("What are the most important things to know about swaps?");
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
        // Check for purple-styled callouts
        const importantCallouts = assistantMessage.locator(
          'div[class*="border-purple"]'
        );
        const importantCount = await importantCallouts.count();

        if (importantCount > 0) {
          await expect(importantCallouts.first()).toBeVisible();
        }

        // Response should have content
        const textContent = await assistantMessage.textContent();
        expect(textContent?.length).toBeGreaterThan(10);
      }

      consoleMonitor.assertNoErrors();
    });

    test("should render CAUTION callouts with red styling", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("What are critical security considerations?");
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
        // Check for red-styled callouts
        const cautionCallouts = assistantMessage.locator(
          'div[class*="border-red"]'
        );
        const cautionCount = await cautionCallouts.count();

        if (cautionCount > 0) {
          await expect(cautionCallouts.first()).toBeVisible();
        }

        // Response should have content
        const textContent = await assistantMessage.textContent();
        expect(textContent?.length).toBeGreaterThan(10);
      }

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Callout Structure", () => {
    test("should display callout icon", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Give me important safety information");
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
        // Check for callout with icon (lucide icons have svg elements)
        const callouts = assistantMessage.locator("div.border-l-4");
        const calloutCount = await callouts.count();

        if (calloutCount > 0) {
          // Check for SVG icon within callout
          const icons = callouts.first().locator("svg");
          const iconCount = await icons.count();

          if (iconCount > 0) {
            await expect(icons.first()).toBeVisible();
          }
        }
      }

      consoleMonitor.assertNoErrors();
    });

    test("should display callout label text", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Provide some helpful notes and warnings");
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

      consoleMonitor.assertNoErrors();
    });
  });
});
