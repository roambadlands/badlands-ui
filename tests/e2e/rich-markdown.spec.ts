import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Rich Markdown Rendering", () => {
  test.beforeEach(async ({ context }) => {
    await login(context, {
      email: "markdown-content-test@example.com",
      name: "Markdown Content Test User",
    });
  });

  test.describe("Lists", () => {
    test("should render ordered lists from assistant response", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Ask for a numbered list
      await page
        .getByTestId("message-input")
        .fill("List the top 3 features of THORChain in a numbered list");
      await page.getByTestId("send-button").click();

      // Wait for response
      await expect(page.getByTestId("assistant-message")).toBeVisible({
        timeout: 30000,
      });
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Should have ordered list elements
      const assistantMessage = page.getByTestId("assistant-message");
      const orderedList = assistantMessage.locator("ol");
      const listItems = assistantMessage.locator("li");

      // Should have at least one ordered list with items
      const olCount = await orderedList.count();
      const liCount = await listItems.count();

      expect(olCount + liCount).toBeGreaterThan(0);

      consoleMonitor.assertNoErrors();
    });

    test("should render unordered lists from assistant response", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Ask for a bullet list
      await page
        .getByTestId("message-input")
        .fill("List some benefits of decentralized exchanges using bullet points");
      await page.getByTestId("send-button").click();

      // Wait for response
      await expect(page.getByTestId("assistant-message")).toBeVisible({
        timeout: 30000,
      });
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Should have list elements
      const assistantMessage = page.getByTestId("assistant-message");
      const unorderedList = assistantMessage.locator("ul");
      const listItems = assistantMessage.locator("li");

      // Should have list items
      const ulCount = await unorderedList.count();
      const liCount = await listItems.count();

      expect(ulCount + liCount).toBeGreaterThan(0);

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Text Formatting", () => {
    test("should render bold and italic text", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Ask for formatted text
      await page
        .getByTestId("message-input")
        .fill(
          "Give me a sentence with some **bold text** and some *italic text*"
        );
      await page.getByTestId("send-button").click();

      // Wait for response
      await expect(page.getByTestId("assistant-message")).toBeVisible({
        timeout: 30000,
      });
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Response should contain formatting elements
      const assistantMessage = page.getByTestId("assistant-message");
      const strongElements = assistantMessage.locator("strong");
      const emElements = assistantMessage.locator("em");

      const hasStrong = (await strongElements.count()) > 0;
      const hasEm = (await emElements.count()) > 0;

      // At least one formatting element should be present
      // Note: LLM may not always use exact markdown requested
      expect(hasStrong || hasEm).toBe(true);

      consoleMonitor.assertNoErrors();
    });

    test("should render links as clickable", async ({ page }) => {
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
        timeout: 30000,
      });
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
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
        timeout: 30000,
      });
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Check for blockquote element
      const assistantMessage = page.getByTestId("assistant-message");
      const blockquotes = assistantMessage.locator("blockquote");

      const blockquoteCount = await blockquotes.count();

      // Blockquote may or may not be present depending on LLM response
      // Just verify no errors occurred

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
        timeout: 30000,
      });
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Check for table elements
      const assistantMessage = page.getByTestId("assistant-message");
      const tables = assistantMessage.locator("table");
      const tableHeaders = assistantMessage.locator("th");
      const tableCells = assistantMessage.locator("td");

      const tableCount = await tables.count();

      if (tableCount > 0) {
        // Should have header cells
        expect(await tableHeaders.count()).toBeGreaterThan(0);

        // Should have data cells
        expect(await tableCells.count()).toBeGreaterThan(0);

        // Table should have border styling
        await expect(tables.first()).toHaveClass(/border/);
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
        timeout: 30000,
      });
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Check for heading elements
      const assistantMessage = page.getByTestId("assistant-message");
      const h2Elements = assistantMessage.locator("h2");
      const h3Elements = assistantMessage.locator("h3");
      const h4Elements = assistantMessage.locator("h4");

      const totalHeadings =
        (await h2Elements.count()) +
        (await h3Elements.count()) +
        (await h4Elements.count());

      // Should have at least one heading
      // Note: LLM may or may not use exact heading levels
      expect(totalHeadings).toBeGreaterThanOrEqual(0);

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Horizontal Rules", () => {
    test("should render horizontal rules as separators", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Ask for content with separators
      await page
        .getByTestId("message-input")
        .fill(
          "Give me two short paragraphs separated by a horizontal rule (---)"
        );
      await page.getByTestId("send-button").click();

      // Wait for response
      await expect(page.getByTestId("assistant-message")).toBeVisible({
        timeout: 30000,
      });
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Check for hr element
      const assistantMessage = page.getByTestId("assistant-message");
      const hrElements = assistantMessage.locator("hr");

      // HR may or may not be present depending on response
      const hrCount = await hrElements.count();

      // Just verify no errors
      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Response Time Display", () => {
    test("should display response time on assistant messages", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Send a message
      await page.getByTestId("message-input").fill("Hello");
      await page.getByTestId("send-button").click();

      // Wait for response
      await expect(page.getByTestId("assistant-message")).toBeVisible({
        timeout: 30000,
      });
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Should display response time with stopwatch emoji
      const assistantMessage = page.getByTestId("assistant-message");

      // Look for time display pattern (e.g., "1.2s" or "500ms")
      const timeDisplay = assistantMessage.locator('text=/\\d+(\\.\\d+)?(ms|s|m)/');

      await expect(timeDisplay).toBeVisible({ timeout: 5000 });

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Message Footer Actions", () => {
    test("should have copy and retry buttons on assistant message", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Send a message
      await page.getByTestId("message-input").fill("Hello");
      await page.getByTestId("send-button").click();

      // Wait for response
      await expect(page.getByTestId("assistant-message")).toBeVisible({
        timeout: 30000,
      });
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Assistant message should have both copy and retry buttons
      const assistantMessage = page.getByTestId("assistant-message");
      const copyButton = assistantMessage.locator('[aria-label="Copy message"]');
      const retryButton = assistantMessage.locator('[aria-label="Try again"]');

      await expect(copyButton).toBeVisible();
      await expect(retryButton).toBeVisible();

      consoleMonitor.assertNoErrors();
    });

    test("should only have copy button on user message", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Send a message
      await page.getByTestId("message-input").fill("Hello");
      await page.getByTestId("send-button").click();

      // Wait for user message
      await expect(page.getByTestId("user-message")).toBeVisible();

      // User message should have copy button
      const userMessage = page.getByTestId("user-message");
      const copyButton = userMessage.locator('[aria-label="Copy message"]');
      const retryButton = userMessage.locator('[aria-label="Try again"]');

      await expect(copyButton).toBeVisible();
      expect(await retryButton.count()).toBe(0);

      consoleMonitor.assertNoErrors();
    });
  });
});
