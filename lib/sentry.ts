import * as Sentry from "@sentry/nextjs";

/**
 * Set user context with tenant ID (no PII)
 */
export function setSentryUser(tenantId: string | null) {
  if (tenantId) {
    Sentry.setUser({ id: tenantId });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for API calls
 */
export function addApiBreadcrumb(
  method: string,
  url: string,
  statusCode?: number,
  error?: string
) {
  Sentry.addBreadcrumb({
    category: "api",
    message: `${method} ${url}`,
    level: error ? "error" : "info",
    data: {
      method,
      url,
      statusCode,
      ...(error && { error }),
    },
  });
}

/**
 * Add breadcrumb for streaming events
 */
export function addStreamingBreadcrumb(
  eventType: string,
  sessionId: string,
  error?: string
) {
  Sentry.addBreadcrumb({
    category: "streaming",
    message: `SSE ${eventType}`,
    level: error ? "error" : "info",
    data: {
      eventType,
      sessionId,
      ...(error && { error }),
    },
  });
}

/**
 * Capture exception with additional context
 */
export function captureError(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Create a custom span for tracing operations
 * Uses OpenTelemetry under the hood via Sentry SDK
 */
export function traceOperation<T>(
  name: string,
  op: string,
  fn: () => T,
  attributes?: Record<string, string | number | boolean>
): T {
  return Sentry.startSpan(
    {
      name,
      op,
      attributes,
    },
    fn
  );
}

/**
 * Create an async span for tracing async operations
 */
export async function traceAsyncOperation<T>(
  name: string,
  op: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op,
      attributes,
    },
    fn
  );
}

/**
 * Add custom context/tags to the current scope
 */
export function setContext(name: string, context: Record<string, unknown>) {
  Sentry.setContext(name, context);
}

/**
 * Set a tag on the current scope (indexed for search)
 */
export function setTag(key: string, value: string | number | boolean) {
  Sentry.setTag(key, value);
}

/**
 * Get distributed tracing headers for cross-service correlation.
 * These headers should be included in API requests to the backend.
 */
export function getTracingHeaders(): Record<string, string> {
  const span = Sentry.getActiveSpan();
  if (!span) return {};

  const headers: Record<string, string> = {};
  const traceHeader = Sentry.spanToTraceHeader(span);
  const baggageHeader = Sentry.spanToBaggageHeader(span);

  if (traceHeader) {
    headers["sentry-trace"] = traceHeader;
  }
  if (baggageHeader) {
    headers["baggage"] = baggageHeader;
  }

  return headers;
}
