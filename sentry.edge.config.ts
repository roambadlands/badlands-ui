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

    // Enable Sentry Logs
    _experiments: {
      enableLogs: true,
    },
  });
}
