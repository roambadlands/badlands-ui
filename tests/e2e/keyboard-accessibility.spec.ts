import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Keyboard Accessibility", () => {
  test.beforeEach(async ({ context }) => {
    await login(context, {
      email: "keyboard-a11y-test@example.com",
      name: "Keyboard A11y Test User",
    });
  });

  test.describe("Chat Input Navigation", () => {
    test("should focus message input with Tab navigation", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Start from the body
      await page.keyboard.press("Tab");

      // Eventually the message input should be focusable
      // Keep tabbing until we reach the input
      for (let i = 0; i < 20; i++) {
        const focusedElement = await page.evaluate(() => {
          const el = document.activeElement;
          return el?.getAttribute("data-testid") || el?.tagName.toLowerCase();
        });

        if (focusedElement === "message-input") {
          break;
        }

        await page.keyboard.press("Tab");
      }

      // Verify input is eventually reachable
      await page.getByTestId("message-input").focus();
      await expect(page.getByTestId("message-input")).toBeFocused();

      consoleMonitor.assertNoErrors();
    });

    test("should navigate between send button and input with Tab", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Focus input and type
      await page.getByTestId("message-input").focus();
      await page.getByTestId("message-input").fill("Test message");

      // Tab to send button
      await page.keyboard.press("Tab");

      // The send button should be focusable when input has content
      await expect(page.getByTestId("send-button")).toBeEnabled();

      consoleMonitor.assertNoErrors();
    });

    test("should submit message with Enter key when input is focused", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      const input = page.getByTestId("message-input");
      await input.focus();
      await input.fill("Test keyboard submit");

      // Press Enter to submit
      await input.press("Enter");

      // Message should be sent
      await expect(page.getByTestId("user-message")).toContainText(
        "Test keyboard submit"
      );

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Session List Navigation", () => {
    test("should navigate session list with keyboard", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Create a session first
      await page.getByTestId("message-input").fill("First session message");
      await page.getByTestId("send-button").click();
      await expect(page.getByTestId("user-message")).toBeVisible();

      // Wait for response
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // New chat button should be focusable
      await page.getByTestId("new-chat-button").focus();
      await expect(page.getByTestId("new-chat-button")).toBeFocused();

      // Press Enter to create new chat
      await page.keyboard.press("Enter");

      // Should have empty input for new chat
      await expect(page.getByTestId("message-input")).toHaveValue("");

      consoleMonitor.assertNoErrors();
    });

    test("should open session menu with keyboard", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Create a session
      await page.getByTestId("message-input").fill("Session for menu test");
      await page.getByTestId("send-button").click();
      await expect(page.getByTestId("user-message")).toBeVisible();

      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Wait for session to appear
      const sessionItem = page.locator('[data-testid^="session-item-"]').first();
      await expect(sessionItem).toBeVisible({ timeout: 10000 });

      // Focus the menu button and activate with Enter
      const menuButton = sessionItem.locator("button");
      await menuButton.focus();
      await page.keyboard.press("Enter");

      // Dropdown should open with Rename and Delete options
      await expect(page.getByRole("menuitem", { name: /rename/i })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: /delete/i })).toBeVisible();

      // Press Escape to close
      await page.keyboard.press("Escape");
      await expect(page.getByRole("menuitem", { name: /rename/i })).not.toBeVisible();

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Dialog Keyboard Navigation", () => {
    test("should close delete dialog with Escape key", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Create a session
      await page.getByTestId("message-input").fill("Session to test dialog");
      await page.getByTestId("send-button").click();
      await expect(page.getByTestId("user-message")).toBeVisible();

      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Wait for session to appear
      const sessionItem = page.locator('[data-testid^="session-item-"]').first();
      await expect(sessionItem).toBeVisible({ timeout: 10000 });

      // Open session menu
      await sessionItem.locator("button").click();
      await page.getByRole("menuitem", { name: /delete/i }).click();

      // Delete dialog should be visible
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByText("Delete Conversation")).toBeVisible();

      // Press Escape to close
      await page.keyboard.press("Escape");

      // Dialog should be closed
      await expect(page.getByRole("dialog")).not.toBeVisible();

      consoleMonitor.assertNoErrors();
    });

    test("should navigate rename dialog with Tab and submit with Enter", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Create a session
      await page.getByTestId("message-input").fill("Session to rename");
      await page.getByTestId("send-button").click();
      await expect(page.getByTestId("user-message")).toBeVisible();

      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Wait for session to appear
      const sessionItem = page.locator('[data-testid^="session-item-"]').first();
      await expect(sessionItem).toBeVisible({ timeout: 10000 });

      // Open rename dialog
      await sessionItem.locator("button").click();
      await page.getByRole("menuitem", { name: /rename/i }).click();

      // Rename dialog should be visible
      await expect(page.getByRole("dialog")).toBeVisible();

      // Input should be focused automatically
      const renameInput = page.getByRole("textbox", { name: /session title/i });
      await expect(renameInput).toBeFocused();

      // Type new name
      await renameInput.fill("New Session Name");

      // Press Enter to submit
      await page.keyboard.press("Enter");

      // Dialog should close after successful rename
      await expect(page.getByRole("dialog")).not.toBeVisible({
        timeout: 5000,
      });

      // Session should have new name
      await expect(sessionItem).toContainText("New Session Name");

      consoleMonitor.assertNoErrors();
    });

    test("should close rename dialog with Escape key", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Create a session
      await page.getByTestId("message-input").fill("Session for escape test");
      await page.getByTestId("send-button").click();
      await expect(page.getByTestId("user-message")).toBeVisible();

      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Wait for session to appear
      const sessionItem = page.locator('[data-testid^="session-item-"]').first();
      await expect(sessionItem).toBeVisible({ timeout: 10000 });

      // Open rename dialog
      await sessionItem.locator("button").click();
      await page.getByRole("menuitem", { name: /rename/i }).click();

      await expect(page.getByRole("dialog")).toBeVisible();

      // Press Escape to close
      await page.keyboard.press("Escape");

      // Dialog should be closed
      await expect(page.getByRole("dialog")).not.toBeVisible();

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("User Menu Keyboard Navigation", () => {
    test("should open user menu with Enter key", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Focus and activate user menu
      await page.getByTestId("user-menu").focus();
      await page.keyboard.press("Enter");

      // Menu should be open with user info
      await expect(page.getByText("keyboard-a11y-test@example.com")).toBeVisible();

      consoleMonitor.assertNoErrors();
    });

    test("should close user menu with Escape key", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Open user menu
      await page.getByTestId("user-menu").click();
      await expect(page.getByText("keyboard-a11y-test@example.com")).toBeVisible();

      // Press Escape to close
      await page.keyboard.press("Escape");

      // Menu should be closed
      await expect(
        page.getByText("keyboard-a11y-test@example.com")
      ).not.toBeVisible();

      consoleMonitor.assertNoErrors();
    });

    test("should navigate to logout with keyboard", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Open user menu
      await page.getByTestId("user-menu").click();

      // Logout button should be visible
      await expect(page.getByTestId("logout-button")).toBeVisible();

      // Navigate to logout with arrow keys
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");

      consoleMonitor.assertNoErrors();
    });
  });
});
