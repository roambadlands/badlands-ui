/**
 * Injects runtime environment variables into window.__ENV__
 *
 * This component reads env vars on the server and injects them into the page
 * so client-side code can access them at runtime (not baked in at build time).
 *
 * Security: This is safe because:
 * - Values come from server-side process.env (controlled by deployment)
 * - JSON.stringify escapes special characters preventing injection
 * - No user input is involved
 */
export function EnvScript() {
  const envVars = {
    NEXT_PUBLIC_BACKEND_URL: process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "",
    NEXT_PUBLIC_APP_URL: process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "",
  };

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.__ENV__ = ${JSON.stringify(envVars)};`,
      }}
    />
  );
}
