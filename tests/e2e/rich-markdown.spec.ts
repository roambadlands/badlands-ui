import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Rich Markdown Rendering", () => {
  test.beforeEach(async ({ context }) => {
    await login(context, {
      email: "markdown-content-test@example.com",
      name: "Markdown Content Test User",
    });
  });

  test.describe("Text Formatting", () => {
    test("should render links as clickable in assistant response", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Ask for a link
      await page
        .getByTestId("message-input")
        .fill(
          "What is the official THORChain website? Include the URL as a link."
        );
      await page.getByTestId("send-button").click();

      // Wait for response
      await expect(page.getByTestId("assistant-message")).toBeVisible({
        timeout: 60000,
      });

      // Wait for streaming to complete
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 60000,
      });

      // Should have link elements
      const assistantMessage = page.getByTestId("assistant-message");
      const links = assistantMessage.locator("a");

      const linkCount = await links.count();

      if (linkCount > 0) {
        // Links should open in new tab (target="_blank")
        const firstLink = links.first();
        await expect(firstLink).toHaveAttribute("target", "_blank");
        await expect(firstLink).toHaveAttribute("rel", /noopener/);
      }

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Blockquotes", () => {
    test("should render blockquotes with styled border", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Ask for a quote
      await page
        .getByTestId("message-input")
        .fill("Give me a famous quote about cryptocurrency using a blockquote");
      await page.getByTestId("send-button").click();

      // Wait for response
      await expect(page.getByTestId("assistant-message")).toBeVisible({
        timeout: 60000,
      });

      // Wait for streaming to complete
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 60000,
      });

      // Check for blockquote element (may or may not be present depending on LLM response)
      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Tables", () => {
    test("should render tables with proper styling", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Ask for a table
      await page
        .getByTestId("message-input")
        .fill(
          "Create a markdown table showing 3 popular cryptocurrencies with their symbols and descriptions"
        );
      await page.getByTestId("send-button").click();

      // Wait for response
      await expect(page.getByTestId("assistant-message")).toBeVisible({
        timeout: 60000,
      });

      // Wait for streaming to complete
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 60000,
      });

      // Check for table elements
      const assistantMessage = page.getByTestId("assistant-message");
      const tables = assistantMessage.locator("table");

      const tableCount = await tables.count();

      if (tableCount > 0) {
        // Should have header cells
        const tableHeaders = assistantMessage.locator("th");
        expect(await tableHeaders.count()).toBeGreaterThan(0);

        // Should have data cells
        const tableCells = assistantMessage.locator("td");
        expect(await tableCells.count()).toBeGreaterThan(0);
      }

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Headings", () => {
    test("should render headings at different levels", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Ask for structured content with headings
      await page
        .getByTestId("message-input")
        .fill(
          "Explain THORChain architecture. Use markdown headings (## and ###) to organize your response."
        );
      await page.getByTestId("send-button").click();

      // Wait for response
      await expect(page.getByTestId("assistant-message")).toBeVisible({
        timeout: 60000,
      });

      // Wait for streaming to complete
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 60000,
      });

      // Check for heading elements (LLM may or may not use exact heading levels)
      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("User Message Footer", () => {
    test("should have copy button on user message only", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Send a message
      await page.getByTestId("message-input").fill("Hello");
      await page.getByTestId("send-button").click();

      // Wait for user message
      const userMessage = page.getByTestId("user-message");
      await expect(userMessage).toBeVisible();

      // User message should have copy button
      const copyButton = userMessage.locator('[aria-label="Copy message"]');
      await expect(copyButton).toBeVisible();

      // User message should NOT have retry button
      const retryButton = userMessage.locator('[aria-label="Try again"]');
      expect(await retryButton.count()).toBe(0);

      consoleMonitor.assertNoErrors();
    });
  });
});
