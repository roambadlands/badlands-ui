import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  // Run tests serially for predictable state management
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Single worker for serial execution
  workers: 1,
  reporter: [
    ["html"],
    // Also output to console for CI visibility
    ["list"],
  ],
  // Global setup ensures backend services are running
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  use: {
    baseURL: "http://localhost:3000",
    // Capture trace on first retry for debugging
    trace: "on-first-retry",
    // Capture video on failure for debugging
    video: process.env.CI ? "on-first-retry" : "off",
    // Screenshot on failure
    screenshot: "only-on-failure",
    // Reasonable timeout for operations
    actionTimeout: 10000,
  },
  // Test timeout
  timeout: 60000,
  // Expect timeout
  expect: {
    timeout: 10000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    // Give the dev server time to start
    timeout: 120000,
  },
});
