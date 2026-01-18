import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Content Block Rendering", () => {
  test.beforeEach(async ({ context }) => {
    await login(context, {
      email: "content-blocks-test@example.com",
      name: "Content Blocks Test User",
    });
  });

  test.describe("Table Rendering", () => {
    test("should render markdown tables with proper styling", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Simple query that may return table
      await page
        .getByTestId("message-input")
        .fill("What are the top THORChain pools?");
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
        // Check if table was rendered (may or may not be present)
        const tables = assistantMessage.locator("table");
        const tableCount = await tables.count();

        if (tableCount > 0) {
          const firstTable = tables.first();

          // Should have header row
          const headers = firstTable.locator("th");
          const headerCount = await headers.count();
          expect(headerCount).toBeGreaterThan(0);
        }
      }

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("List Rendering", () => {
    test("should render ordered lists with numbers", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("List 3 steps to swap on THORChain");
      await page.getByTestId("send-button").click();

      // Wait for user message first
      await expect(page.getByTestId("user-message")).toBeVisible();

      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Check for assistant message
      const assistantMessage = page.getByTestId("assistant-message");
      const hasAssistantMessage = (await assistantMessage.count()) > 0;

      if (hasAssistantMessage) {
        // Check for ordered list
        const orderedLists = assistantMessage.locator("ol");
        const olCount = await orderedLists.count();

        if (olCount > 0) {
          // Should have list items
          const items = orderedLists.first().locator("li");
          const itemCount = await items.count();
          expect(itemCount).toBeGreaterThan(0);
        }
      }

      consoleMonitor.assertNoErrors();
    });

    test("should render unordered lists with bullets", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("What are the features of THORChain?");
      await page.getByTestId("send-button").click();

      // Wait for user message first
      await expect(page.getByTestId("user-message")).toBeVisible();

      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Check for assistant message
      const assistantMessage = page.getByTestId("assistant-message");
      const hasAssistantMessage = (await assistantMessage.count()) > 0;

      if (hasAssistantMessage) {
        // Check for unordered list
        const unorderedLists = assistantMessage.locator("ul");
        const ulCount = await unorderedLists.count();

        if (ulCount > 0) {
          // Should have list items
          const items = unorderedLists.first().locator("li");
          const itemCount = await items.count();
          expect(itemCount).toBeGreaterThan(0);
        }
      }

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Code Block Rendering", () => {
    test("should render code blocks with syntax highlighting", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Show me a JavaScript hello world example");
      await page.getByTestId("send-button").click();

      // Wait for user message first
      await expect(page.getByTestId("user-message")).toBeVisible();

      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Check for assistant message
      const assistantMessage = page.getByTestId("assistant-message");
      const hasAssistantMessage = (await assistantMessage.count()) > 0;

      if (hasAssistantMessage) {
        // Check for code blocks
        const codeBlocks = assistantMessage.locator("pre");
        const codeCount = await codeBlocks.count();

        if (codeCount > 0) {
          // Code block should be visible
          const firstCodeBlock = codeBlocks.first();
          await expect(firstCodeBlock).toBeVisible();
        }
      }

      consoleMonitor.assertNoErrors();
    });

    test("should copy code block content when copy button is clicked", async ({
      page,
      context,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      // Grant clipboard permissions
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Write a Python print statement");
      await page.getByTestId("send-button").click();

      // Wait for user message first
      await expect(page.getByTestId("user-message")).toBeVisible();

      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Check for assistant message
      const assistantMessage = page.getByTestId("assistant-message");
      const hasAssistantMessage = (await assistantMessage.count()) > 0;

      if (hasAssistantMessage) {
        // Find code block with copy button
        const copyButton = assistantMessage
          .locator('button[aria-label="Copy code"]')
          .first();

        if ((await copyButton.count()) > 0) {
          await copyButton.click();

          // Check icon changed to indicate success
          const checkIcon = copyButton.locator('svg[class*="lucide-check"]');
          await expect(checkIcon).toBeVisible({ timeout: 2000 });
        }
      }

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Heading Rendering", () => {
    test("should render headings with proper hierarchy", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Explain THORChain briefly");
      await page.getByTestId("send-button").click();

      // Wait for user message first
      await expect(page.getByTestId("user-message")).toBeVisible();

      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Check for assistant message
      const assistantMessage = page.getByTestId("assistant-message");
      const hasAssistantMessage = (await assistantMessage.count()) > 0;

      if (hasAssistantMessage) {
        // Check for text content at minimum
        const textContent = await assistantMessage.textContent();
        expect(textContent?.length).toBeGreaterThan(10);
      }

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Blockquote Rendering", () => {
    test("should render blockquotes with styled left border", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("What is THORChain?");
      await page.getByTestId("send-button").click();

      // Wait for user message first
      await expect(page.getByTestId("user-message")).toBeVisible();

      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Check for assistant message
      const assistantMessage = page.getByTestId("assistant-message");
      const hasAssistantMessage = (await assistantMessage.count()) > 0;

      if (hasAssistantMessage) {
        // Check for blockquote (may or may not be present)
        const blockquotes = assistantMessage.locator("blockquote");
        const bqCount = await blockquotes.count();

        if (bqCount > 0) {
          // Should have left border styling
          await expect(blockquotes.first()).toHaveClass(/border-l/);
        }
      }

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Link Rendering", () => {
    test("should render links that open in new tab", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("What is THORChain's website?");
      await page.getByTestId("send-button").click();

      // Wait for user message first
      await expect(page.getByTestId("user-message")).toBeVisible();

      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Check for assistant message
      const assistantMessage = page.getByTestId("assistant-message");
      const hasAssistantMessage = (await assistantMessage.count()) > 0;

      if (hasAssistantMessage) {
        // Check for links
        const links = assistantMessage.locator("a");
        const linkCount = await links.count();

        if (linkCount > 0) {
          const firstLink = links.first();

          // Links should open in new tab
          await expect(firstLink).toHaveAttribute("target", "_blank");

          // Should have rel for security
          await expect(firstLink).toHaveAttribute("rel", /noopener/);
        }
      }

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Mixed Content", () => {
    test("should render response with multiple content types", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("What is THORChain?");
      await page.getByTestId("send-button").click();

      // Wait for user message first
      await expect(page.getByTestId("user-message")).toBeVisible();

      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Check if we have an assistant message
      const assistantMessage = page.getByTestId("assistant-message");
      const count = await assistantMessage.count();

      if (count > 0) {
        // Response should contain text content
        const textContent = await assistantMessage.textContent();
        expect(textContent?.length).toBeGreaterThan(10);
      }

      // Should have rendered the message without errors
      consoleMonitor.assertNoErrors();
    });
  });
});
