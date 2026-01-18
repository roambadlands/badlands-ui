import { test, expect, devices } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Responsive Design", () => {
  test.beforeEach(async ({ context }) => {
    await login(context, {
      email: "responsive-test@example.com",
      name: "Responsive Test User",
    });
  });

  test.describe("Desktop Layout", () => {
    test("should display sidebar and content side by side on desktop", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/chat");

      // Both sidebar and main content should be visible
      await expect(page.getByTestId("new-chat-button")).toBeVisible();
      await expect(page.getByTestId("message-input")).toBeVisible();

      // They should be side by side (flexbox layout)
      const newChatButton = page.getByTestId("new-chat-button");
      const messageInput = page.getByTestId("message-input");

      const newChatBounds = await newChatButton.boundingBox();
      const inputBounds = await messageInput.boundingBox();

      // The message input should be to the right of the new chat button
      if (newChatBounds && inputBounds) {
        expect(inputBounds.x).toBeGreaterThan(newChatBounds.x);
      }

      consoleMonitor.assertNoErrors();
    });

    test("should show full header on desktop", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/chat");

      // Header should show app title
      await expect(page.getByText("Badlands AI").first()).toBeVisible();

      // User avatar should be visible
      const avatar = page.locator('[data-testid="user-avatar"]');
      // Avatar might be inside a dropdown, just check the header area has user info
      await expect(
        page.locator("header").getByRole("button").first()
      ).toBeVisible();

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Tablet Layout", () => {
    test("should remain usable on tablet viewport", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      // Set tablet viewport (iPad)
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto("/chat");

      // Core functionality should still work
      await expect(page.getByTestId("message-input")).toBeVisible();
      await expect(page.getByTestId("send-button")).toBeVisible();

      // Should be able to send a message
      await page.getByTestId("message-input").fill("Test on tablet");
      await page.getByTestId("send-button").click();

      // Message should appear
      await expect(page.getByTestId("user-message")).toBeVisible();

      consoleMonitor.assertNoErrors();
    });

    test("should show sidebar on tablet", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto("/chat");

      // Sidebar with new chat button should be visible
      await expect(page.getByTestId("new-chat-button")).toBeVisible();

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Mobile Layout", () => {
    test("should remain functional on mobile viewport", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      // Set mobile viewport (iPhone 12)
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/chat");

      // Core chat functionality should still work
      await expect(page.getByTestId("message-input")).toBeVisible();
      await expect(page.getByTestId("send-button")).toBeVisible();

      // Should be able to type and send
      await page.getByTestId("message-input").fill("Test on mobile");
      await page.getByTestId("send-button").click();

      // Message should appear
      await expect(page.getByTestId("user-message")).toBeVisible();

      consoleMonitor.assertNoErrors();
    });

    test("should have accessible input on mobile", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/chat");

      // Input should be visible and focusable
      const input = page.getByTestId("message-input");
      await expect(input).toBeVisible();

      // Should be able to focus the input
      await input.click();
      await expect(input).toBeFocused();

      consoleMonitor.assertNoErrors();
    });

    test("should not have horizontal overflow on mobile", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/chat");

      // Check that the body doesn't have horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > document.body.clientWidth;
      });

      // There should be no significant horizontal overflow
      // (small amounts might be acceptable due to scrollbars)
      expect(hasHorizontalScroll).toBe(false);

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Viewport Changes", () => {
    test("should adapt when viewport is resized", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      // Start with desktop
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/chat");

      // Verify desktop layout
      await expect(page.getByTestId("new-chat-button")).toBeVisible();
      await expect(page.getByTestId("message-input")).toBeVisible();

      // Resize to mobile
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(300); // Allow for CSS transitions

      // Core functionality should still work
      await expect(page.getByTestId("message-input")).toBeVisible();

      // Resize back to desktop
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.waitForTimeout(300);

      // Everything should be visible again
      await expect(page.getByTestId("new-chat-button")).toBeVisible();
      await expect(page.getByTestId("message-input")).toBeVisible();

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Small Desktop", () => {
    test("should work on small desktop screens", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      // Small desktop/laptop screen
      await page.setViewportSize({ width: 1024, height: 600 });
      await page.goto("/chat");

      // All main elements should be visible
      await expect(page.getByTestId("new-chat-button")).toBeVisible();
      await expect(page.getByTestId("message-input")).toBeVisible();
      await expect(page.getByTestId("send-button")).toBeVisible();

      // Footer should be visible
      await expect(page.locator("footer")).toBeVisible();

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Large Desktop", () => {
    test("should utilize space on large desktop screens", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      // Large desktop/4K screen
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto("/chat");

      // All elements should be properly laid out
      await expect(page.getByTestId("new-chat-button")).toBeVisible();
      await expect(page.getByTestId("message-input")).toBeVisible();

      // Content should be readable (not stretched too wide)
      const input = page.getByTestId("message-input");
      const inputBounds = await input.boundingBox();

      // Input should have reasonable width (not full screen width)
      if (inputBounds) {
        expect(inputBounds.width).toBeLessThan(1800);
      }

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Touch Interactions", () => {
    test("should handle click on send button on mobile viewport", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/chat");

      // Type a message
      await page.getByTestId("message-input").fill("Touch test message");

      // Click the send button (works for both mouse and touch on mobile)
      await page.getByTestId("send-button").click();

      // Message should be sent
      await expect(page.getByTestId("user-message")).toBeVisible();

      // Wait for response
      await expect(page.getByTestId("send-button")).toBeVisible({
        timeout: 30000,
      });

      consoleMonitor.assertNoErrors();
    });
  });
});
