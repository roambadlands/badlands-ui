import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import packageJson from "./package.json";

function getSecurityHeaders() {
  // Use non-prefixed env var to read at runtime (NEXT_PUBLIC_* is inlined at build time)
  const backendUrl =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8080";

  // Sentry domains for error reporting and replay
  const sentryDomains = "*.ingest.sentry.io *.sentry.io";

  return [
    {
      key: "X-DNS-Prefetch-Control",
      value: "on",
    },
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
    {
      key: "X-Frame-Options",
      value: "DENY",
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
    },
    {
      key: "Content-Security-Policy",
      value: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval in dev
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        `connect-src 'self' ${backendUrl} ${sentryDomains}`,
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "worker-src 'self' blob:", // Required for Sentry replay
      ].join("; "),
    },
  ];
}

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: getSecurityHeaders(),
      },
    ];
  },
};

// Wrap with Sentry configuration for source map uploads
export default withSentryConfig(nextConfig, {
  // Suppress source map upload logs during build
  silent: true,

  // Upload source maps to Sentry
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token for source map uploads
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Source map options
  sourcemaps: {
    // Delete source maps after upload to keep them private
    deleteSourcemapsAfterUpload: true,
  },
});
