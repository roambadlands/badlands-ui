import { execSync } from "child_process";

const SKIP_DOCKER = process.env.E2E_SKIP_DOCKER === "true";
const KEEP_DOCKER = process.env.E2E_KEEP_DOCKER === "true";

/**
 * Global teardown for E2E tests.
 * Optionally stops docker-compose services after tests complete.
 */
async function globalTeardown(): Promise<void> {
  console.log("\n[E2E Teardown] Starting...");

  // Check if we should skip docker management
  if (SKIP_DOCKER || KEEP_DOCKER) {
    console.log(
      "[E2E Teardown] Skipping docker-compose shutdown (SKIP_DOCKER or KEEP_DOCKER set)"
    );
    return;
  }

  // Only stop in CI by default, keep running locally for faster iteration
  const isCI = process.env.CI === "true";
  if (!isCI) {
    console.log(
      "[E2E Teardown] Not in CI, keeping docker-compose running for faster iteration"
    );
    console.log(
      "[E2E Teardown] To stop: docker compose -f docker-compose.e2e.yml down"
    );
    return;
  }

  console.log("[E2E Teardown] Stopping docker-compose services...");
  try {
    execSync("docker compose -f docker-compose.e2e.yml down", {
      cwd: process.cwd(),
      stdio: "inherit",
    });
  } catch (error) {
    console.warn("[E2E Teardown] Warning: Failed to stop docker-compose:", error);
    // Don't throw - teardown failures shouldn't fail the test run
  }

  console.log("[E2E Teardown] Complete!\n");
}

export default globalTeardown;
