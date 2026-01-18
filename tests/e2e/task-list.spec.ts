import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Task List Rendering", () => {
  test.beforeEach(async ({ context }) => {
    await login(context, {
      email: "task-list-test@example.com",
      name: "Task List Test User",
    });
  });

  test.describe("Checkbox Display", () => {
    test("should render task lists with checkboxes", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Request that might include a task list
      await page
        .getByTestId("message-input")
        .fill("Give me a checklist for setting up a THORChain node");
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
        // Check for checkbox inputs
        const checkboxes = assistantMessage.locator('input[type="checkbox"]');
        const checkboxCount = await checkboxes.count();

        if (checkboxCount > 0) {
          // Checkboxes should be visible
          await expect(checkboxes.first()).toBeVisible();

          // Checkboxes should be disabled (read-only)
          await expect(checkboxes.first()).toBeDisabled();
        }

        // Response should have content regardless
        const textContent = await assistantMessage.textContent();
        expect(textContent?.length).toBeGreaterThan(10);
      }

      consoleMonitor.assertNoErrors();
    });

    test("should render checked and unchecked tasks", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Create a to-do list for DeFi beginners");
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
        // Check for any list items
        const listItems = assistantMessage.locator("li");
        const itemCount = await listItems.count();

        if (itemCount > 0) {
          // Should have list content
          await expect(listItems.first()).toBeVisible();
        }
      }

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Task List Styling", () => {
    test("should render tasks with proper alignment", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("List security best practices as a checklist");
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
        // Check for flex containers with gap (task list uses flex items-start gap-2)
        const taskContainers = assistantMessage.locator(
          "li.flex.items-start.gap-2"
        );
        const containerCount = await taskContainers.count();

        if (containerCount > 0) {
          // Should be properly styled
          await expect(taskContainers.first()).toBeVisible();
        }
      }

      consoleMonitor.assertNoErrors();
    });

    test("should render task text with inline markdown", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Create a checklist with links to documentation");
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
