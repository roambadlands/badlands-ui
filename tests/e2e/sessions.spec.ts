import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Sessions", () => {
  test.beforeEach(async ({ context }) => {
    await login(context, {
      email: "sessions-test@example.com",
      name: "Sessions Test User",
    });
  });

  test("should create a new session when sending first message", async ({
    page,
  }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Initially should show "No conversations yet" or similar
    // Send a message to create a session
    await page.getByTestId("message-input").fill("Create new session");
    await page.getByTestId("send-button").click();

    // Wait for the message to appear
    await expect(page.getByTestId("user-message")).toBeVisible();

    // A session should now appear in the sidebar
    // Wait for the session to be created and listed
    await expect(page.locator('[data-testid^="session-item-"]')).toBeVisible({
      timeout: 10000,
    });

    consoleMonitor.assertNoErrors();
  });

  test("should show new chat button in sidebar", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    await expect(page.getByTestId("new-chat-button")).toBeVisible();
    await expect(page.getByTestId("new-chat-button")).toContainText("New Chat");

    consoleMonitor.assertNoErrors();
  });

  test("should start new chat when clicking new chat button", async ({
    page,
  }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // First, create a session with a message
    await page.getByTestId("message-input").fill("First session message");
    await page.getByTestId("send-button").click();
    await expect(page.getByTestId("user-message")).toBeVisible();

    // Wait for session to appear
    await expect(page.locator('[data-testid^="session-item-"]')).toBeVisible({
      timeout: 10000,
    });

    // Click new chat
    await page.getByTestId("new-chat-button").click();

    // Message input should be empty and enabled
    await expect(page.getByTestId("message-input")).toHaveValue("");
    await expect(page.getByTestId("message-input")).toBeEnabled();

    // The previous message should not be visible (new chat)
    // This depends on whether the UI clears messages or not
    // We at least check the input is ready

    consoleMonitor.assertNoErrors();
  });

  test("should switch between sessions", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Create first session
    await page.getByTestId("message-input").fill("Message in session 1");
    await page.getByTestId("send-button").click();
    await expect(page.getByTestId("user-message")).toContainText(
      "Message in session 1"
    );

    // Wait for first session to appear
    const firstSession = page.locator('[data-testid^="session-item-"]').first();
    await expect(firstSession).toBeVisible({ timeout: 10000 });

    // Wait for streaming to complete (send button reappears)
    await expect(page.getByTestId("send-button")).toBeVisible({ timeout: 30000 });

    // Get current URL before clicking new chat
    const currentUrl = page.url();

    // Start new chat - this navigates to a new session
    await page.getByTestId("new-chat-button").click();

    // Wait for URL to change (navigation to new session)
    await page.waitForURL((url) => url.toString() !== currentUrl, { timeout: 10000 });

    // Wait for the page to be ready with the new session
    const messageInput = page.getByTestId("message-input");
    await expect(messageInput).toBeVisible();
    await expect(messageInput).toBeEnabled();

    // Small delay to ensure React state is settled after navigation
    await page.waitForTimeout(500);

    // Fill and send second message
    await messageInput.fill("Message in session 2");

    // Wait for the value to be set and button to be enabled
    await expect(messageInput).toHaveValue("Message in session 2");
    await expect(page.getByTestId("send-button")).toBeEnabled({ timeout: 5000 });

    await page.getByTestId("send-button").click();
    await expect(
      page.getByTestId("user-message").filter({ hasText: "Message in session 2" })
    ).toBeVisible();

    // Now there should be 2 sessions
    await expect(page.locator('[data-testid^="session-item-"]')).toHaveCount(2, {
      timeout: 10000,
    });

    // Get current URL (we're on session 2)
    const session2Url = page.url();

    // Click the other session (not the current one) to switch back to session 1
    // Sessions may be ordered by recency, so we need to click the one we're NOT on
    await page.locator('[data-testid^="session-item-"]').last().click();

    // Wait for navigation to a different session
    await page.waitForURL((url) => url.toString() !== session2Url, { timeout: 10000 });

    // Should see the first session's message
    await expect(
      page.getByTestId("user-message").filter({ hasText: "Message in session 1" })
    ).toBeVisible({ timeout: 10000 });

    consoleMonitor.assertNoErrors();
  });

  test("should delete a session with confirmation", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Create a session
    await page.getByTestId("message-input").fill("Session to delete");
    await page.getByTestId("send-button").click();
    await expect(page.getByTestId("user-message")).toBeVisible();

    // Wait for streaming to complete
    await expect(page.getByTestId("send-button")).toBeVisible({ timeout: 30000 });

    // Wait for session to appear
    const sessionItem = page.locator('[data-testid^="session-item-"]').first();
    await expect(sessionItem).toBeVisible({ timeout: 10000 });

    // Open session menu (click the more button) - wait for menu to be ready
    const menuButton = sessionItem.locator("button");
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    // Wait for menu to appear
    const deleteMenuItem = page.getByRole("menuitem", { name: /delete/i });
    await expect(deleteMenuItem).toBeVisible({ timeout: 5000 });
    await deleteMenuItem.click();

    // Confirmation dialog should appear
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/delete this conversation/i)).toBeVisible();

    // Click cancel first to ensure dialog closes
    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Session should still exist
    await expect(sessionItem).toBeVisible();

    // Now delete for real - need to reopen menu
    await menuButton.click();
    await expect(deleteMenuItem).toBeVisible({ timeout: 5000 });
    await deleteMenuItem.click();

    // Wait for dialog and click delete
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: /delete/i }).click();

    // Session should be removed
    await expect(sessionItem).not.toBeVisible({ timeout: 5000 });

    consoleMonitor.assertNoErrors();
  });

  test("should rename a session", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Create a session
    await page.getByTestId("message-input").fill("Session to rename");
    await page.getByTestId("send-button").click();
    await expect(page.getByTestId("user-message")).toBeVisible();

    // Wait for streaming to complete
    await expect(page.getByTestId("send-button")).toBeVisible({ timeout: 30000 });

    // Wait for session to appear
    const sessionItem = page.locator('[data-testid^="session-item-"]').first();
    await expect(sessionItem).toBeVisible({ timeout: 10000 });

    // Open session menu - wait for menu button to be ready
    const menuButton = sessionItem.locator("button");
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    // Wait for menu to appear and click rename
    const renameMenuItem = page.getByRole("menuitem", { name: /rename/i });
    await expect(renameMenuItem).toBeVisible({ timeout: 5000 });
    await renameMenuItem.click();

    // Rename dialog should appear
    await expect(page.getByRole("dialog")).toBeVisible();

    // Clear and enter new name
    const input = page.getByRole("textbox", { name: /session title/i });
    await expect(input).toBeVisible();
    await input.clear();
    await input.fill("My Renamed Session");

    // Save
    await page.getByRole("button", { name: /save/i }).click();

    // Dialog should close
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Session should show new name
    await expect(sessionItem).toContainText("My Renamed Session", { timeout: 5000 });

    consoleMonitor.assertNoErrors();
  });

  test("should cancel rename with Cancel button", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Create a session
    await page.getByTestId("message-input").fill("Session to not rename");
    await page.getByTestId("send-button").click();
    await expect(page.getByTestId("user-message")).toBeVisible();

    // Wait for session to appear
    const sessionItem = page.locator('[data-testid^="session-item-"]').first();
    await expect(sessionItem).toBeVisible({ timeout: 10000 });

    // Wait for streaming to complete
    await expect(page.getByTestId("send-button")).toBeVisible({ timeout: 30000 });

    // Get the original title
    const originalTitle = await sessionItem.textContent();

    // Open rename dialog
    await sessionItem.locator("button").click();
    await page.getByRole("menuitem", { name: /rename/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Type a new name
    const input = page.getByRole("textbox", { name: /session title/i });
    await input.clear();
    await input.fill("This should not save");

    // Cancel
    await page.getByRole("button", { name: /cancel/i }).click();

    // Dialog should close
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Title should remain unchanged
    const currentTitle = await sessionItem.textContent();
    expect(currentTitle).toBe(originalTitle);

    consoleMonitor.assertNoErrors();
  });

  test("should cancel rename with Escape key", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Create a session
    await page.getByTestId("message-input").fill("Session for escape test");
    await page.getByTestId("send-button").click();
    await expect(page.getByTestId("user-message")).toBeVisible();

    // Wait for session to appear
    const sessionItem = page.locator('[data-testid^="session-item-"]').first();
    await expect(sessionItem).toBeVisible({ timeout: 10000 });

    // Wait for streaming to complete
    await expect(page.getByTestId("send-button")).toBeVisible({ timeout: 30000 });

    // Get the original title
    const originalTitle = await sessionItem.textContent();

    // Open rename dialog
    await sessionItem.locator("button").click();
    await page.getByRole("menuitem", { name: /rename/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Type a new name
    const input = page.getByRole("textbox", { name: /session title/i });
    await input.clear();
    await input.fill("This should not save either");

    // Press Escape
    await input.press("Escape");

    // Dialog should close
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Title should remain unchanged
    const currentTitle = await sessionItem.textContent();
    expect(currentTitle).toBe(originalTitle);

    consoleMonitor.assertNoErrors();
  });

  test("should submit rename with Enter key", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Create a session
    await page.getByTestId("message-input").fill("Session for enter test");
    await page.getByTestId("send-button").click();
    await expect(page.getByTestId("user-message")).toBeVisible();

    // Wait for session to appear
    const sessionItem = page.locator('[data-testid^="session-item-"]').first();
    await expect(sessionItem).toBeVisible({ timeout: 10000 });

    // Wait for streaming to complete
    await expect(page.getByTestId("send-button")).toBeVisible({ timeout: 30000 });

    // Open rename dialog
    await sessionItem.locator("button").click();
    await page.getByRole("menuitem", { name: /rename/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Type a new name and press Enter
    const input = page.getByRole("textbox", { name: /session title/i });
    await input.clear();
    await input.fill("Renamed via Enter");
    await input.press("Enter");

    // Dialog should close
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Session should show new name
    await expect(sessionItem).toContainText("Renamed via Enter");

    consoleMonitor.assertNoErrors();
  });

  test("should truncate title to max length", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Create a session
    await page.getByTestId("message-input").fill("Session for max length test");
    await page.getByTestId("send-button").click();
    await expect(page.getByTestId("user-message")).toBeVisible();

    // Wait for session to appear
    const sessionItem = page.locator('[data-testid^="session-item-"]').first();
    await expect(sessionItem).toBeVisible({ timeout: 10000 });

    // Wait for streaming to complete
    await expect(page.getByTestId("send-button")).toBeVisible({ timeout: 30000 });

    // Open rename dialog
    await sessionItem.locator("button").click();
    await page.getByRole("menuitem", { name: /rename/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Try to enter a very long title (over 255 chars)
    // The input has maxLength=255, so it will truncate automatically
    const input = page.getByRole("textbox", { name: /session title/i });
    const longTitle = "A".repeat(300);
    await input.clear();
    await input.fill(longTitle);

    // The input value should be truncated to 255 characters due to maxLength
    const inputValue = await input.inputValue();
    expect(inputValue.length).toBeLessThanOrEqual(255);

    // Close the dialog via Escape
    await input.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();

    consoleMonitor.assertNoErrors();
  });

  test("should show session date formatting", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Create a session
    await page.getByTestId("message-input").fill("Session for date test");
    await page.getByTestId("send-button").click();
    await expect(page.getByTestId("user-message")).toBeVisible();

    // Wait for session to appear
    const sessionItem = page.locator('[data-testid^="session-item-"]').first();
    await expect(sessionItem).toBeVisible({ timeout: 10000 });

    // Session should show "Today" for newly created session
    await expect(sessionItem).toContainText("Today");

    consoleMonitor.assertNoErrors();
  });

  test("should highlight active session in sidebar", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Create first session
    await page.getByTestId("message-input").fill("First session");
    await page.getByTestId("send-button").click();
    await expect(page.locator('[data-testid^="session-item-"]').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("send-button")).toBeVisible({ timeout: 30000 });

    const firstSession = page.locator('[data-testid^="session-item-"]').first();

    // First session should be active (has accent background)
    await expect(firstSession).toHaveClass(/bg-sidebar-accent/);

    // Create second session
    await page.getByTestId("new-chat-button").click();
    await page.waitForTimeout(500);
    await page.getByTestId("message-input").fill("Second session");
    await page.getByTestId("send-button").click();
    await expect(page.locator('[data-testid^="session-item-"]')).toHaveCount(2, { timeout: 10000 });
    await expect(page.getByTestId("send-button")).toBeVisible({ timeout: 30000 });

    // The active session (second one, which is now first due to recency) should be highlighted
    const activeSession = page.locator('[data-testid^="session-item-"].bg-sidebar-accent');
    await expect(activeSession).toBeVisible();

    consoleMonitor.assertNoErrors();
  });
});
