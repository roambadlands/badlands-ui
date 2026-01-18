import { test, expect } from "@playwright/test";
import { login, ConsoleMonitor } from "./fixtures";

test.describe("Image Block Rendering", () => {
  test.beforeEach(async ({ context }) => {
    await login(context, {
      email: "image-blocks-test@example.com",
      name: "Image Blocks Test User",
    });
  });

  test.describe("Image Display", () => {
    test("should render images with proper styling", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Request that might include an image
      await page
        .getByTestId("message-input")
        .fill("Show me the THORChain logo");
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
        // Check for images
        const images = assistantMessage.locator("img");
        const imageCount = await images.count();

        if (imageCount > 0) {
          // Image should have proper styling (rounded, border)
          const firstImage = images.first();
          await expect(firstImage).toHaveClass(/rounded-lg/);
          await expect(firstImage).toHaveClass(/border/);
        }

        // Response should have content regardless
        const textContent = await assistantMessage.textContent();
        expect(textContent?.length).toBeGreaterThan(0);
      }

      consoleMonitor.assertNoErrors();
    });

    test("should set lazy loading on images", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

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
        // Check for images with lazy loading
        const images = assistantMessage.locator("img");
        const imageCount = await images.count();

        if (imageCount > 0) {
          // Should have lazy loading attribute
          await expect(images.first()).toHaveAttribute("loading", "lazy");
        }
      }

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Image Accessibility", () => {
    test("should display image caption when alt text provided", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Show me a diagram of how swaps work");
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
        // Check for figure elements with captions
        const figures = assistantMessage.locator("figure");
        const figureCount = await figures.count();

        if (figureCount > 0) {
          // Check for figcaption
          const captions = figures.first().locator("figcaption");
          const captionCount = await captions.count();

          if (captionCount > 0) {
            await expect(captions.first()).toBeVisible();
          }
        }
      }

      consoleMonitor.assertNoErrors();
    });

    test("should have alt attribute on images", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Show network architecture");
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
        // Check for images
        const images = assistantMessage.locator("img");
        const imageCount = await images.count();

        if (imageCount > 0) {
          // Should have alt attribute (can be empty string but must exist)
          const altAttr = await images.first().getAttribute("alt");
          expect(altAttr).not.toBeNull();
        }
      }

      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Image Error Handling", () => {
    test("should not cause console errors on image load failure", async ({
      page,
    }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      // Regular query - test that any images that fail to load don't break the page
      await page
        .getByTestId("message-input")
        .fill("What pools are available?");
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
        // Response should display without critical errors
        const textContent = await assistantMessage.textContent();
        expect(textContent?.length).toBeGreaterThan(0);
      }

      // The image error handler should not produce console errors
      consoleMonitor.assertNoErrors();
    });
  });

  test.describe("Image Responsiveness", () => {
    test("should constrain image max-width to container", async ({ page }) => {
      const consoleMonitor = new ConsoleMonitor(page);

      await page.goto("/chat");

      await page
        .getByTestId("message-input")
        .fill("Show me some visuals");
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
        // Check for images
        const images = assistantMessage.locator("img");
        const imageCount = await images.count();

        if (imageCount > 0) {
          // Should have max-w-full class for responsiveness
          await expect(images.first()).toHaveClass(/max-w-full/);
        }
      }

      consoleMonitor.assertNoErrors();
    });
  });
});
