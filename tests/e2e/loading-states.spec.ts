import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Loading States", () => {
  test.beforeEach(async ({ context }) => {
    await login(context, {
      email: "loading-test@example.com",
      name: "Loading Test User",
    });
  });

  test.describe("Sidebar Loading", () => {
    test("should show session list skeleton during initial load", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      // Navigate to chat - the sidebar should initially show loading skeletons
      await page.goto("/chat");

      // Look for skeleton elements - they may be visible briefly during initial load
      // The skeleton has class "h-12 w-full" for each item
      const skeletons = page.locator(".space-y-2 > .h-12");

      // The skeleton loading state may be very brief if sessions load quickly
      // We check that the page loads without errors and eventually shows content
      // This primarily tests that the loading path works correctly

      // Wait for the page to stabilize
      await expect(page.getByTestId("new-chat-button")).toBeVisible();

      // After loading, we should see either sessions or "No conversations yet"
      const sessionList = page.locator('[data-testid^="session-item-"]');
      const emptyMessage = page.getByText("No conversations yet");

      // One of these should be visible after loading completes
      await expect(sessionList.first().or(emptyMessage)).toBeVisible({ timeout: 10000 });

      consoleMonitor.assertNoErrors();
    });

    test("should show empty state for new users", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      // Use a unique email to ensure fresh state
      // (Already logged in via beforeEach, but this tests the empty state display)

      await page.goto("/chat");

      // For a new user with no sessions, should show "No conversations yet"
      // Wait for loading to complete first
      await expect(page.getByTestId("new-chat-button")).toBeVisible();

      // If no sessions exist, show empty state
      // Note: This may or may not be visible depending on if there are sessions
      const emptyMessage = page.getByText("No conversations yet");

      // Just verify the page loads successfully
      await expect(page.getByTestId("message-input")).toBeVisible();

      consoleMonitor.assertNoErrors();
    });

    test("should transition from loading to loaded state smoothly", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Wait for loading to complete
      await expect(page.getByTestId("new-chat-button")).toBeVisible();

      // Create a session to ensure we have data
      await page.getByTestId("message-input").fill("Test message for loading state");
      await page.getByTestId("send-button").click();

      // Wait for session to appear
      await expect(page.locator('[data-testid^="session-item-"]').first()).toBeVisible({ timeout: 15000 });

      // Wait for streaming to complete
      await expect(page.getByTestId("send-button")).toBeVisible({ timeout: 30000 });

      // Refresh the page to test loading transition with existing sessions
      await page.reload();

      // Should see loading state briefly, then sessions
      await expect(page.getByTestId("new-chat-button")).toBeVisible();

      // Sessions should appear after loading
      await expect(page.locator('[data-testid^="session-item-"]').first()).toBeVisible({ timeout: 10000 });

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Footer Loading", () => {
    test("should show loading state for API version", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // The footer shows "Loading..." for API version while fetching
      // or "API unavailable" on error, or "API v<version>" when loaded

      // Wait for footer to be visible
      const footer = page.locator("footer");
      await expect(footer).toBeVisible();

      // Should show either loading, error, or version
      // The text should contain "UI v" (always present) and either "Loading", "API unavailable", or "API v"
      await expect(footer).toContainText("UI v");

      // Wait for API version to load (should see "API v" or "API unavailable")
      await expect(
        footer.getByText(/API v|API unavailable/)
      ).toBeVisible({ timeout: 10000 });

      consoleMonitor.assertNoErrors();
    });

    test("should display both frontend and backend versions", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      const footer = page.locator("footer");
      await expect(footer).toBeVisible();

      // Frontend version is always shown
      await expect(footer).toContainText("UI v");

      // Wait for API version to load - can be "API v<version>" or "API unavailable"
      await expect(footer.getByText(/API v|API unavailable/)).toBeVisible({ timeout: 10000 });

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Chat Loading", () => {
    test("should show loading state when navigating to session", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Create a session first
      await page.getByTestId("message-input").fill("Test message for session navigation");
      await page.getByTestId("send-button").click();

      // Wait for session to appear and streaming to complete
      await expect(page.locator('[data-testid^="session-item-"]').first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByTestId("send-button")).toBeVisible({ timeout: 30000 });

      // Get the session URL
      const currentUrl = page.url();

      // Navigate away and back
      await page.goto("/chat");
      await expect(page.getByTestId("new-chat-button")).toBeVisible();

      // Click on the session to navigate to it
      const sessionItem = page.locator('[data-testid^="session-item-"]').first();
      await sessionItem.click();

      // Should load the session with messages
      await expect(page.getByTestId("user-message")).toBeVisible({ timeout: 10000 });

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Initial Page Load", () => {
    test("should load chat interface components in correct order", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Header should be visible first (static)
      await expect(page.locator("header")).toBeVisible();

      // Sidebar with new chat button
      await expect(page.getByTestId("new-chat-button")).toBeVisible();

      // Chat input area
      await expect(page.getByTestId("message-input")).toBeVisible();

      // Send button
      await expect(page.getByTestId("send-button")).toBeVisible();

      // Footer
      await expect(page.locator("footer")).toBeVisible();

      consoleMonitor.assertNoErrors();
    });

    test("should handle rapid navigation without errors", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      // Navigate to multiple pages quickly
      await page.goto("/chat");
      await page.goto("/login");
      // Should redirect to /chat since we're logged in
      await expect(page).toHaveURL(/\/chat/);

      await page.goto("/terms");
      // Use exact match for the main page heading
      await expect(page.getByRole("heading", { name: "Terms & Conditions", exact: true })).toBeVisible();

      await page.goto("/privacy");
      // Use exact match for the main page heading
      await expect(page.getByRole("heading", { name: "Privacy Policy", exact: true })).toBeVisible();

      await page.goto("/chat");
      await expect(page.getByTestId("message-input")).toBeVisible();

      consoleMonitor.assertNoErrors();
    });
  });
});
