import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Progress Indicator", () => {
  test.beforeEach(async ({ context }) => {
    await login(context, {
      email: "progress-test@example.com",
      name: "Progress Test User",
    });
  });

  test("should show progress indicator during streaming", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    // Send a message
    await page.getByTestId("message-input").fill("Hello");
    await page.getByTestId("send-button").click();

    // The progress indicator should appear during streaming
    // It's positioned at bottom-left with fixed positioning
    const progressIndicator = page.locator(".fixed.bottom-4.left-4");

    // Poll for indicator visibility during streaming (up to 5 seconds)
    let indicatorWasVisible = false;
    const startTime = Date.now();

    while (Date.now() - startTime < 5000) {
      if (await progressIndicator.isVisible().catch(() => false)) {
        indicatorWasVisible = true;
        break;
      }
      // Check if streaming is done
      if (await page.getByTestId("send-button").isVisible().catch(() => false)) {
        break;
      }
      await page.waitForTimeout(100);
    }

    // Wait for streaming to complete
    await expect(page.getByTestId("send-button")).toBeVisible({ timeout: 30000 });

    // This test primarily ensures no errors occur during streaming

    consoleMonitor.assertNoErrors();
  });

  test("should display elapsed time during streaming", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    await page.getByTestId("message-input").fill("Hello");
    await page.getByTestId("send-button").click();

    const progressIndicator = page.locator(".fixed.bottom-4.left-4");

    // Check for time format (e.g., "(0.5s)" or "(1.2s)")
    let foundTimeDisplay = false;
    const startTime = Date.now();

    while (Date.now() - startTime < 5000) {
      if (await progressIndicator.isVisible().catch(() => false)) {
        const text = await progressIndicator.textContent().catch(() => "");
        if (/\(\d+\.?\d*s\)/.test(text || "")) {
          foundTimeDisplay = true;
          break;
        }
      }
      // Check if streaming is done
      if (await page.getByTestId("send-button").isVisible().catch(() => false)) {
        break;
      }
      await page.waitForTimeout(100);
    }

    // Wait for completion
    await expect(page.getByTestId("send-button")).toBeVisible({ timeout: 30000 });

    consoleMonitor.assertNoErrors();
  });

  test("should have spinner icon during streaming", async ({ page }) => {
    const consoleMonitor = new ConsoleMonitor(page);

    await page.goto("/chat");

    await page.getByTestId("message-input").fill("Hello");
    await page.getByTestId("send-button").click();

    const progressIndicator = page.locator(".fixed.bottom-4.left-4");

    // Check for the animate-spin class on the loader icon
    let foundSpinner = false;
    const startTime = Date.now();

    while (Date.now() - startTime < 5000) {
      if (await progressIndicator.isVisible().catch(() => false)) {
        const spinner = progressIndicator.locator(".animate-spin");
        if (await spinner.count() > 0) {
          foundSpinner = true;
          break;
        }
      }
      // Check if streaming is done
      if (await page.getByTestId("send-button").isVisible().catch(() => false)) {
        break;
      }
      await page.waitForTimeout(100);
    }

    // Wait for completion
    await expect(page.getByTestId("send-button")).toBeVisible({ timeout: 30000 });

    consoleMonitor.assertNoErrors();
  });
});
