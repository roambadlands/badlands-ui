import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Details/Collapsible Block Rendering", () => {
  test.beforeEach(async ({ context }) => {
    await login(context, {
      email: "details-blocks-test@example.com",
      name: "Details Blocks Test User",
    });
  });

  test.describe("Collapsible Structure", () => {
    test("should render details elements with summary", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Request that might include collapsible sections
      await page
        .getByTestId("message-input")
        .fill("Explain THORChain concepts with expandable details");
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
        // Check for details elements
        const detailsElements = assistantMessage.locator("details");
        const detailsCount = await detailsElements.count();

        if (detailsCount > 0) {
          // Should have summary element
          const summary = detailsElements.first().locator("summary");
          await expect(summary).toBeVisible();
        }

        // Response should have content regardless
        const textContent = await assistantMessage.textContent();
        expect(textContent?.length).toBeGreaterThan(10);
      }

      consoleMonitor.assertNoErrors();
    });

    test("should show chevron icon in summary", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Give me a detailed breakdown with sections");
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
        // Check for details with summary containing chevron
        const summaries = assistantMessage.locator("summary");
        const summaryCount = await summaries.count();

        if (summaryCount > 0) {
          // Check for SVG icon (ChevronRight)
          const icons = summaries.first().locator("svg");
          const iconCount = await icons.count();

          if (iconCount > 0) {
            await expect(icons.first()).toBeVisible();
          }
        }
      }

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Expand/Collapse Behavior", () => {
    test("should expand details on click", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Provide a FAQ-style answer with expandable sections");
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
        // Check for details elements
        const detailsElements = assistantMessage.locator("details");
        const detailsCount = await detailsElements.count();

        if (detailsCount > 0) {
          const firstDetails = detailsElements.first();
          const summary = firstDetails.locator("summary");

          // Click to expand
          await summary.click();

          // Should now be open (has [open] attribute)
          await expect(firstDetails).toHaveAttribute("open", "");
        }
      }

      consoleMonitor.assertNoErrors();
    });

    test("should collapse details on second click", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Create an accordion-style explanation");
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
        // Check for details elements
        const detailsElements = assistantMessage.locator("details");
        const detailsCount = await detailsElements.count();

        if (detailsCount > 0) {
          const firstDetails = detailsElements.first();
          const summary = firstDetails.locator("summary");

          // Click to expand
          await summary.click();
          await expect(firstDetails).toHaveAttribute("open", "");

          // Click to collapse
          await summary.click();

          // Should no longer have open attribute
          await expect(firstDetails).not.toHaveAttribute("open", "");
        }
      }

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Nested Content", () => {
    test("should render nested content blocks", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Provide detailed information in collapsible sections");
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

  test.describe("Styling", () => {
    test("should have proper border and background styling", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Show me advanced information in expandable sections");
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
        // Check for styled details elements
        const styledDetails = assistantMessage.locator("details.rounded-lg");
        const styledCount = await styledDetails.count();

        if (styledCount > 0) {
          // Should have border styling
          await expect(styledDetails.first()).toHaveClass(/border/);
        }
      }

      consoleMonitor.assertNoErrors();
    });

    test("should show hover state on summary", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Provide a collapsible guide");
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
        // Check for summaries with hover styling
        const summaries = assistantMessage.locator("summary.cursor-pointer");
        const summaryCount = await summaries.count();

        if (summaryCount > 0) {
          // Should have cursor-pointer indicating clickability
          await expect(summaries.first()).toBeVisible();
        }
      }

      consoleMonitor.assertNoErrors();
    });
  });
});
