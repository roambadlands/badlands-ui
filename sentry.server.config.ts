import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment:
      process.env.SENTRY_ENVIRONMENT ||
      (process.env.NODE_ENV === "production" ? "production" : "development"),
    release: process.env.SENTRY_RELEASE,
    debug: process.env.SENTRY_DEBUG === "true",

    // Performance monitoring - 100% sample rate
    tracesSampleRate: 1.0,

    // Profiling for performance insights
    profilesSampleRate: 1.0,

    // Enable Sentry Logs
    _experiments: {
      enableLogs: true,
    },

    // Integrations
    integrations: [
      // Capture console.error and console.warn as breadcrumbs
      Sentry.captureConsoleIntegration({ levels: ["error", "warn"] }),
    ],

    // Data sanitization
    beforeSend(event) {
      return sanitizeServerEvent(event);
    },
  });
}

function sanitizeServerEvent(
  event: Sentry.ErrorEvent
): Sentry.ErrorEvent | null {
  // Remove potentially sensitive request body data
  if (event.request?.data) {
    const data = event.request.data;
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        if (parsed.content) {
          parsed.content = "[REDACTED]";
        }
        event.request.data = JSON.stringify(parsed);
      } catch {
        // Not JSON, leave as-is
      }
    }
  }

  // Remove auth headers
  if (event.request?.headers) {
    delete event.request.headers["cookie"];
    delete event.request.headers["authorization"];
  }

  return event;
}
