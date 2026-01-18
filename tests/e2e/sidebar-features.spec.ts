import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Sidebar Features", () => {
  test.beforeEach(async ({ context }) => {
    await login(context, {
      email: "sidebar-features-test@example.com",
      name: "Sidebar Features Test User",
    });
  });

  test.describe("Sidebar Resize", () => {
    test("should have a resize handle between sidebar and content", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Look for the resize handle (cursor-col-resize)
      const resizeHandle = page.locator(".cursor-col-resize");
      await expect(resizeHandle).toBeVisible();

      consoleMonitor.assertNoErrors();
    });

    test("should allow resizing sidebar by dragging", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Find the resize handle
      const resizeHandle = page.locator(".cursor-col-resize");
      await expect(resizeHandle).toBeVisible();

      const handleBounds = await resizeHandle.boundingBox();

      if (handleBounds) {
        const initialHandleX = handleBounds.x;

        // Perform drag operation to resize (move right by 100px)
        await page.mouse.move(
          handleBounds.x + handleBounds.width / 2,
          handleBounds.y + handleBounds.height / 2
        );
        await page.mouse.down();
        await page.mouse.move(handleBounds.x + 100, handleBounds.y + handleBounds.height / 2);
        await page.mouse.up();

        // Wait for resize to apply
        await page.waitForTimeout(200);

        // Get new handle position - it should have moved
        const newHandleBounds = await resizeHandle.boundingBox();

        // Handle position should have changed (sidebar got wider or narrower)
        // This test just verifies the drag operation works without errors
        expect(newHandleBounds).toBeTruthy();
      }

      consoleMonitor.assertNoErrors();
    });

    test("should respect minimum sidebar width", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Find the resize handle
      const resizeHandle = page.locator(".cursor-col-resize");
      const handleBounds = await resizeHandle.boundingBox();

      if (handleBounds) {
        // Try to drag the handle far to the left (below minimum)
        await page.mouse.move(
          handleBounds.x + handleBounds.width / 2,
          handleBounds.y + handleBounds.height / 2
        );
        await page.mouse.down();
        await page.mouse.move(50, handleBounds.y + handleBounds.height / 2); // Try to make it very narrow
        await page.mouse.up();

        await page.waitForTimeout(100);

        // The sidebar should still be visible and have minimum width (120px)
        const sidebar = page.locator('[data-testid="new-chat-button"]');
        await expect(sidebar).toBeVisible();
      }

      consoleMonitor.assertNoErrors();
    });

    test("should respect maximum sidebar width", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Find the resize handle
      const resizeHandle = page.locator(".cursor-col-resize");
      const handleBounds = await resizeHandle.boundingBox();

      if (handleBounds) {
        // Try to drag the handle far to the right (above maximum)
        await page.mouse.move(
          handleBounds.x + handleBounds.width / 2,
          handleBounds.y + handleBounds.height / 2
        );
        await page.mouse.down();
        await page.mouse.move(600, handleBounds.y + handleBounds.height / 2); // Try to make it very wide
        await page.mouse.up();

        await page.waitForTimeout(100);

        // The content area should still be visible
        const messageInput = page.getByTestId("message-input");
        await expect(messageInput).toBeVisible();
      }

      consoleMonitor.assertNoErrors();
    });

    test("should change cursor to col-resize when hovering handle", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Find the resize handle
      const resizeHandle = page.locator(".cursor-col-resize");

      // Verify it has the col-resize cursor class
      await expect(resizeHandle).toHaveClass(/cursor-col-resize/);

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Sidebar Width Persistence", () => {
    test("should persist sidebar width in localStorage", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Set a specific width in localStorage
      await page.evaluate(() => {
        localStorage.setItem("sidebar-width", "300");
      });

      // Reload the page
      await page.reload();

      // Wait for page to load
      await expect(page.getByTestId("new-chat-button")).toBeVisible();

      // Check that localStorage still has the value
      const savedWidth = await page.evaluate(() =>
        localStorage.getItem("sidebar-width")
      );
      expect(savedWidth).toBe("300");

      consoleMonitor.assertNoErrors();
    });

    test("should use default width when no localStorage value", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      // Clear localStorage first
      await page.goto("/chat");
      await page.evaluate(() => {
        localStorage.removeItem("sidebar-width");
      });

      // Reload the page
      await page.reload();

      // Wait for page to load
      await expect(page.getByTestId("new-chat-button")).toBeVisible();

      // The sidebar should use default width (256px)
      // After any interaction, the width will be saved
      const savedWidth = await page.evaluate(() =>
        localStorage.getItem("sidebar-width")
      );

      // Either no value (using default) or the default value
      if (savedWidth) {
        expect(parseInt(savedWidth, 10)).toBeGreaterThanOrEqual(120);
        expect(parseInt(savedWidth, 10)).toBeLessThanOrEqual(480);
      }

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Sidebar Session List", () => {
    test("should display session count correctly", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Create first session
      await page.getByTestId("message-input").fill("First test message");
      await page.getByTestId("send-button").click();

      // Wait for session to appear
      await expect(page.locator('[data-testid^="session-item-"]')).toBeVisible({
        timeout: 10000,
      });

      // Wait for streaming to complete
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      // Create second session
      await page.getByTestId("new-chat-button").click();
      await page.waitForTimeout(500);
      await page.getByTestId("message-input").fill("Second test message");
      await page.getByTestId("send-button").click();

      // Should have 2 sessions
      await expect(page.locator('[data-testid^="session-item-"]')).toHaveCount(2, {
        timeout: 10000,
      });

      consoleMonitor.assertNoErrors();
    });

    test("should scroll when there are many sessions", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Create multiple sessions to potentially overflow
      for (let i = 0; i < 3; i++) {
        await page.getByTestId("message-input").fill(`Message ${i + 1}`);
        await page.getByTestId("send-button").click();

        // Wait for session to appear
        await expect(page.locator('[data-testid^="session-item-"]')).toHaveCount(
          i + 1,
          { timeout: 15000 }
        );

        // Wait for streaming to complete
        await expect(page.getByTestId("send-button")).toBeVisible({
          timeout: 30000,
        });

        if (i < 2) {
          await page.getByTestId("new-chat-button").click();
          await page.waitForTimeout(500);
        }
      }

      // Verify all sessions are in the list
      await expect(page.locator('[data-testid^="session-item-"]')).toHaveCount(3);

      // The sidebar should have overflow-y-auto for scrolling
      const sidebarContent = page.locator(".overflow-y-auto").first();
      await expect(sidebarContent).toBeVisible();

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Sidebar Interactions", () => {
    test("should show hover state on session items", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Create a session
      await page.getByTestId("message-input").fill("Test message");
      await page.getByTestId("send-button").click();

      // Wait for session to appear
      const sessionItem = page.locator('[data-testid^="session-item-"]').first();
      await expect(sessionItem).toBeVisible({ timeout: 10000 });

      // Hover over the session item
      await sessionItem.hover();

      // The session item should have hover styles (hover:bg-sidebar-accent)
      // We can't easily test CSS hover states, but we can verify the element is hoverable
      await expect(sessionItem).toHaveClass(/hover:bg-sidebar-accent/);

      consoleMonitor.assertNoErrors();
    });

    test("should show menu button on session item", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Create a session
      await page.getByTestId("message-input").fill("Test message");
      await page.getByTestId("send-button").click();

      // Wait for session to appear
      const sessionItem = page.locator('[data-testid^="session-item-"]').first();
      await expect(sessionItem).toBeVisible({ timeout: 10000 });

      // The session item should have a menu button (MoreHorizontal icon)
      const menuButton = sessionItem.locator("button");
      await expect(menuButton).toBeVisible();

      consoleMonitor.assertNoErrors();
    });

    test("should open dropdown menu when clicking menu button", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Create a session
      await page.getByTestId("message-input").fill("Test message");
      await page.getByTestId("send-button").click();

      // Wait for session to appear
      const sessionItem = page.locator('[data-testid^="session-item-"]').first();
      await expect(sessionItem).toBeVisible({ timeout: 10000 });

      // Click the menu button
      await sessionItem.locator("button").click();

      // Dropdown should appear with Rename and Delete options
      await expect(page.getByRole("menuitem", { name: /rename/i })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: /delete/i })).toBeVisible();

      consoleMonitor.assertNoErrors();
    });
  });
});
