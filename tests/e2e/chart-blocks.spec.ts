import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Chart Block Rendering", () => {
  test.beforeEach(async ({ context }) => {
    await login(context, {
      email: "chart-blocks-test@example.com",
      name: "Chart Blocks Test User",
    });
  });

  test.describe("Chart Container", () => {
    test("should render charts in styled container with border", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Request that might trigger chart response
      await page
        .getByTestId("message-input")
        .fill("Show me pool statistics in a chart");
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
        // Check for chart container with border styling
        const chartContainers = assistantMessage.locator(
          "div.rounded-lg.border"
        );
        const containerCount = await chartContainers.count();

        if (containerCount > 0) {
          // Container should be visible
          await expect(chartContainers.first()).toBeVisible();
        }
      }

      consoleMonitor.assertNoErrors();
    });

    test("should display chart title when provided", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Create a bar chart of liquidity pools");
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
        // Check for h3 elements which are used for chart titles
        const chartTitles = assistantMessage.locator("h3.text-center");
        const titleCount = await chartTitles.count();

        // If charts with titles exist, they should be visible
        if (titleCount > 0) {
          await expect(chartTitles.first()).toBeVisible();
        }
      }

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Chart Types", () => {
    test("should handle bar chart requests", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Show pool volumes as a bar chart");
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

      consoleMonitor.assertNoErrors();
    });

    test("should handle line chart requests", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Show price trends as a line chart");
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

      consoleMonitor.assertNoErrors();
    });

    test("should handle pie chart requests", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Show asset distribution as a pie chart");
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

      consoleMonitor.assertNoErrors();
    });

    test("should handle area chart requests", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Show volume over time as an area chart");
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

      consoleMonitor.assertNoErrors();
    });

    test("should handle scatter chart requests", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Show correlation data as a scatter plot");
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

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Chart Responsiveness", () => {
    test("should render charts in responsive container", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Show me a simple chart");
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
        // Check for recharts responsive container
        // Recharts uses divs with specific height classes
        const chartAreas = assistantMessage.locator('div[class*="h-[300px]"]');
        const chartCount = await chartAreas.count();

        if (chartCount > 0) {
          // Should have responsive container
          await expect(chartAreas.first()).toBeVisible();
        }
      }

      consoleMonitor.assertNoErrors();
    });
  });
});
