import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isDevelopment = process.env.NODE_ENV === "development";

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
      (process.env.NODE_ENV === "production" ? "production" : "development"),
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    debug: process.env.NEXT_PUBLIC_SENTRY_DEBUG === "true",

    // Performance monitoring - 100% sample rate
    tracesSampleRate: 1.0,

    // Profiling for performance insights
    profilesSampleRate: 1.0,

    // Session replay for debugging
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Enable Sentry Logs
    _experiments: {
      enableLogs: true,
    },

    // Enable Spotlight for local development debugging
    spotlight: isDevelopment,

    // Data sanitization - strip sensitive data
    beforeSend(event) {
      return sanitizeEvent(event);
    },

    // Integrations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Mask all text content and inputs for privacy
        maskAllText: true,
        blockAllMedia: true,
      }),
      // Capture console.error and console.warn as breadcrumbs
      Sentry.captureConsoleIntegration({ levels: ["error", "warn"] }),
      // User feedback widget
      Sentry.feedbackIntegration({
        colorScheme: "system",
        isNameRequired: false,
        isEmailRequired: false,
      }),
    ],
  });
}

function sanitizeEvent(
  event: Sentry.ErrorEvent
): Sentry.ErrorEvent | null {
  // Remove message content from breadcrumbs
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
      if (breadcrumb.data) {
        // Redact message content
        if (breadcrumb.data.content) {
          breadcrumb.data.content = "[REDACTED]";
        }
        if (breadcrumb.data.message) {
          breadcrumb.data.message = "[REDACTED]";
        }
        // Redact auth tokens from headers
        if (breadcrumb.data.headers) {
          const headers = breadcrumb.data.headers as Record<string, unknown>;
          delete headers["Authorization"];
          delete headers["X-CSRF-Token"];
        }
      }
      return breadcrumb;
    });
  }

  // Sanitize request data
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

  return event;
}
