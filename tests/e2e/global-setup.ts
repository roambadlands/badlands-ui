import { execSync } from "child_process";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
const SKIP_DOCKER = process.env.E2E_SKIP_DOCKER === "true";

/**
 * Global setup for E2E tests.
 * Ensures backend services are running before tests start.
 */
async function globalSetup(): Promise<void> {
  console.log("\n[E2E Setup] Starting...");

  // Check if we should skip docker management
  if (SKIP_DOCKER) {
    console.log("[E2E Setup] E2E_SKIP_DOCKER=true, skipping docker-compose");
    await waitForBackend();
    return;
  }

  // Check if backend is already running
  const backendRunning = await isBackendHealthy();
  if (backendRunning) {
    console.log("[E2E Setup] Backend already running, skipping docker-compose");
    return;
  }

  // Start docker-compose
  console.log("[E2E Setup] Starting docker-compose services...");
  try {
    execSync("docker compose -f docker-compose.e2e.yml up -d --wait --build", {
      cwd: process.cwd(),
      stdio: "inherit",
    });
  } catch (error) {
    console.error("[E2E Setup] Failed to start docker-compose:", error);
    throw error;
  }

  // Wait for backend to be healthy
  await waitForBackend();

  console.log("[E2E Setup] Complete!\n");
}

async function isBackendHealthy(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForBackend(timeoutMs = 60000): Promise<void> {
  console.log(`[E2E Setup] Waiting for backend at ${BACKEND_URL}...`);

  const startTime = Date.now();
  const pollInterval = 1000;

  while (Date.now() - startTime < timeoutMs) {
    const healthy = await isBackendHealthy();
    if (healthy) {
      console.log("[E2E Setup] Backend is healthy!");
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(
    `Backend did not become healthy within ${timeoutMs / 1000}s. ` +
      `Make sure docker-compose.e2e.yml services are running.`
  );
}

export default globalSetup;
