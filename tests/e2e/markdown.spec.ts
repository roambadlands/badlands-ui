import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Markdown Rendering", () => {
  test.beforeEach(async ({ context }) => {
    await login(context, {
      email: "markdown-test@example.com",
      name: "Markdown Test User",
    });
  });

  test.describe("XSS Prevention", () => {
    test("should not execute scripts in user messages", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      // Track if any alert dialog appears
      let alertShown = false;
      page.on("dialog", async (dialog) => {
        alertShown = true;
        await dialog.dismiss();
      });

      await page.goto("/chat");

      // Send a message with XSS attempt
      await page.getByTestId("message-input").fill(
        "<script>alert('xss')</script> test"
      );
      await page.getByTestId("send-button").click();

      await expect(page.getByTestId("user-message")).toBeVisible();

      // Give time for any scripts to execute
      await page.waitForTimeout(500);

      // No alert should have been triggered
      expect(alertShown).toBe(false);

      // User message should not contain executable scripts
      const userMessage = page.getByTestId("user-message");
      const scripts = userMessage.locator("script");
      expect(await scripts.count()).toBe(0);

      consoleMonitor.assertNoErrors();
    });

    test("should sanitize HTML in user messages", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Send a message with HTML
      await page.getByTestId("message-input").fill(
        "Test <b>bold</b> and <img src=x onerror=alert('xss')>"
      );
      await page.getByTestId("send-button").click();

      await expect(page.getByTestId("user-message")).toBeVisible();

      // The message text should be displayed (may be escaped)
      const userMessage = page.getByTestId("user-message");
      const content = await userMessage.textContent();
      expect(content).toContain("Test");

      consoleMonitor.assertNoErrors();
    });
  });
});
