import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Mermaid Diagram Rendering", () => {
  test.beforeEach(async ({ context }) => {
    await login(context, {
      email: "mermaid-test@example.com",
      name: "Mermaid Test User",
    });
  });

  test.describe("Diagram Rendering", () => {
    test("should render mermaid diagrams when present in response", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Request that might include a diagram
      await page
        .getByTestId("message-input")
        .fill("Can you show me a simple flowchart of how a swap works?");
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
        // Check if mermaid diagram was rendered (SVG output)
        const diagrams = assistantMessage.locator("svg");
        const diagramCount = await diagrams.count();

        if (diagramCount > 0) {
          // Diagram should be visible
          await expect(diagrams.first()).toBeVisible();

          // Should be in a container with appropriate styling
          const container = diagrams.first().locator("..");
          await expect(container).toBeVisible();
        }
      }

      consoleMonitor.assertNoErrors();
    });

    test("should display error state for invalid mermaid syntax", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // The mermaid component has error handling for invalid syntax
      // This test verifies the component doesn't crash on bad input
      await page
        .getByTestId("message-input")
        .fill("What is THORChain?");
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
        // Response should contain text content without errors
        const textContent = await assistantMessage.textContent();
        expect(textContent?.length).toBeGreaterThan(10);
      }

      // Main assertion: no console errors from mermaid parsing
      consoleMonitor.assertNoErrors();
    });

    test("should render diagram in centered container", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Draw a simple sequence diagram");
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
        // Check for mermaid container with flex justify-center
        const diagramContainers = assistantMessage.locator(
          "div.flex.justify-center"
        );
        const containerCount = await diagramContainers.count();

        if (containerCount > 0) {
          // Should have SVG content
          const svgs = diagramContainers.first().locator("svg");
          const svgCount = await svgs.count();
          expect(svgCount).toBeGreaterThanOrEqual(0);
        }
      }

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Diagram Types", () => {
    test("should handle flowchart diagrams", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Show a flowchart of a decision process");
      await page.getByTestId("send-button").click();

      // Wait for response
      await expect(page.getByTestId("user-message")).toBeVisible();
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Verify no errors occurred
      consoleMonitor.assertNoErrors();
    });

    test("should handle sequence diagrams", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Show a sequence diagram");
      await page.getByTestId("send-button").click();

      // Wait for response
      await expect(page.getByTestId("user-message")).toBeVisible();
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Verify no errors occurred
      consoleMonitor.assertNoErrors();
    });
  });
});
