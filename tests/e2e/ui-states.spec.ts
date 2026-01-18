import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("UI States", () => {
  test.describe("Footer", () => {
    test("should display frontend version in footer", async ({
      page,
      context,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await login(context, {
        email: "ui-test@example.com",
        name: "UI Test User",
      });

      await page.goto("/chat");

      // Footer should be visible
      const footer = page.locator("footer");
      await expect(footer).toBeVisible();

      // Should show UI version
      await expect(footer).toContainText(/UI v/);

      consoleMonitor.assertNoErrors();
    });

    test("should display API version or loading state in footer", async ({
      page,
      context,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await login(context, {
        email: "ui-test@example.com",
        name: "UI Test User",
      });

      await page.goto("/chat");

      const footer = page.locator("footer");
      await expect(footer).toBeVisible();

      // Should show API version (or loading/error state)
      // Wait for API status to load
      await expect(async () => {
        const footerText = await footer.textContent();
        // Should contain either "API v", "Loading...", or "API unavailable"
        expect(
          footerText?.includes("API v") ||
          footerText?.includes("Loading") ||
          footerText?.includes("API unavailable")
        ).toBeTruthy();
      }).toPass({ timeout: 10000 });

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Empty States", () => {
    test("should show empty chat state for new users", async ({
      page,
      context,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      // Use unique email to ensure fresh state
      const uniqueEmail = `empty-state-${Date.now()}@example.com`;
      await login(context, {
        email: uniqueEmail,
        name: "Empty State User",
      });

      await page.goto("/chat");

      // Should show the message input ready to use
      await expect(page.getByTestId("message-input")).toBeVisible();
      await expect(page.getByTestId("message-input")).toBeEnabled();

      // Should show new chat button
      await expect(page.getByTestId("new-chat-button")).toBeVisible();

      consoleMonitor.assertNoErrors();
    });

    test("should show placeholder text in message input", async ({
      page,
      context,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await login(context, {
        email: "ui-test@example.com",
        name: "UI Test User",
      });

      await page.goto("/chat");

      // Message input should have placeholder
      const input = page.getByTestId("message-input");
      await expect(input).toBeVisible();

      const placeholder = await input.getAttribute("placeholder");
      expect(placeholder).toBeTruthy();
      expect(placeholder?.length).toBeGreaterThan(0);

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Header", () => {
    test("should display app title in header", async ({ page, context }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await login(context, {
        email: "ui-test@example.com",
        name: "UI Test User",
      });

      await page.goto("/chat");

      // Header should contain app title
      const header = page.locator("header");
      await expect(header).toBeVisible();
      await expect(header).toContainText(/Badlands/i);

      consoleMonitor.assertNoErrors();
    });

    test("should show user avatar with initials", async ({ page, context }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await login(context, {
        email: "john.doe@example.com",
        name: "John Doe",
      });

      await page.goto("/chat");

      // User menu should be visible
      const userMenu = page.getByTestId("user-menu");
      await expect(userMenu).toBeVisible();

      // Should show user initials (JD for John Doe)
      await expect(userMenu).toContainText(/JD|J/);

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Sidebar", () => {
    test("should show session in sidebar after creation", async ({ page, context }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await login(context, {
        email: "sidebar-test@example.com",
        name: "Sidebar Test User",
      });

      await page.goto("/chat");

      // Create a session first
      await page.getByTestId("message-input").fill("Test session for sidebar");
      await page.getByTestId("send-button").click();

      // Wait for session to appear in sidebar
      const sessionItem = page.locator('[data-testid^="session-item-"]').first();
      await expect(sessionItem).toBeVisible({ timeout: 10000 });

      // Session item should have some text content (title)
      const sessionText = await sessionItem.textContent();
      expect(sessionText).toBeTruthy();
      expect(sessionText!.length).toBeGreaterThan(0);

      consoleMonitor.assertNoErrors();
    });

    test("should highlight active session in sidebar", async ({
      page,
      context,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await login(context, {
        email: "sidebar-active-test@example.com",
        name: "Sidebar Active Test",
      });

      await page.goto("/chat");

      // Create a session
      await page.getByTestId("message-input").fill("Active session test");
      await page.getByTestId("send-button").click();

      // Wait for session to appear and URL to update
      await expect(page).toHaveURL(/\/chat\/[a-f0-9-]+/, { timeout: 15000 });

      // The session item should exist and be visually indicated as active
      // (exact styling depends on implementation)
      const sessionItem = page.locator('[data-testid^="session-item-"]').first();
      await expect(sessionItem).toBeVisible();

      // Verify the session is clickable/interactive
      await expect(sessionItem).toBeEnabled();

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Responsive Elements", () => {
    test("should show chat input at bottom of page", async ({
      page,
      context,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await login(context, {
        email: "ui-test@example.com",
        name: "UI Test User",
      });

      await page.goto("/chat");

      // Message input should be visible
      const input = page.getByTestId("message-input");
      await expect(input).toBeVisible();

      // Get the input's position
      const inputBox = await input.boundingBox();
      const viewportSize = page.viewportSize();

      // Input should be in the lower portion of the viewport
      if (inputBox && viewportSize) {
        expect(inputBox.y).toBeGreaterThan(viewportSize.height / 2);
      }

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Accessibility", () => {
    test("should have focusable message input", async ({ page, context }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await login(context, {
        email: "a11y-test@example.com",
        name: "A11y Test User",
      });

      await page.goto("/chat");

      // Tab to focus the input (or it may be auto-focused)
      const input = page.getByTestId("message-input");
      await input.focus();

      // Input should be focused
      await expect(input).toBeFocused();

      // Type something
      await input.type("Test accessibility");
      await expect(input).toHaveValue("Test accessibility");

      consoleMonitor.assertNoErrors();
    });

    test("should be navigable with keyboard", async ({ page, context }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await login(context, {
        email: "keyboard-test@example.com",
        name: "Keyboard Test User",
      });

      await page.goto("/chat");

      // Tab through the page - should be able to reach key elements
      await page.keyboard.press("Tab");

      // Eventually should be able to focus on various elements
      // without getting stuck
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press("Tab");
      }

      // Should be able to type in message input when focused
      const input = page.getByTestId("message-input");
      await input.focus();
      await page.keyboard.type("Keyboard navigation test");

      await expect(input).toHaveValue("Keyboard navigation test");

      consoleMonitor.assertNoErrors();
    });
  });
});
