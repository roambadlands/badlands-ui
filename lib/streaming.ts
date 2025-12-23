import type {
  SSEEvent,
  SSEContentEvent,
  SSEToolCallStartEvent,
  SSEToolCallEndEvent,
  SSECitationEvent,
  SSEUsageEvent,
  SSEDoneEvent,
  SSEErrorEvent,
  SendMessageRequest,
} from "./types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

function getCsrfToken(): string {
  // Read CSRF token from cookie (double-submit pattern)
  // Note: Token is stored without encoding, so read it directly
  if (typeof document === "undefined") {
    return "";
  }
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? match[1] : "";
}

async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "X-CSRF-Token": getCsrfToken(),
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.csrf_token && typeof document !== "undefined") {
        document.cookie = `csrf_token=${data.csrf_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export interface StreamCallbacks {
  onContent?: (text: string) => void;
  onToolCallStart?: (id: string, tool: string) => void;
  onToolCallEnd?: (
    id: string,
    tool: string,
    output?: Record<string, unknown>,
    error?: string
  ) => void;
  onCitation?: (source: string, sourceRef: string, reference: string) => void;
  onUsage?: (
    inputTokens: number,
    outputTokens: number,
    totalTokens: number,
    costUsd: number
  ) => void;
  onDone?: (messageId: string) => void;
  onError?: (code: string, message: string) => void;
}

/**
 * Parses a single SSE event line
 * Backend format: {"type":"content","data":{"text":"Hello"}}
 * We extract the inner `data` field to match our SSEEvent types
 */
function parseSSEEvent(eventType: string, data: string): SSEEvent | null {
  try {
    const parsed = JSON.parse(data);
    // Backend wraps data in { type, data } structure - extract the inner data
    const eventData = parsed.data;

    switch (eventType) {
      case "content":
        return { type: "content", data: eventData } as SSEContentEvent;
      case "tool_call_start":
        return { type: "tool_call_start", data: eventData } as SSEToolCallStartEvent;
      case "tool_call_end":
        return { type: "tool_call_end", data: eventData } as SSEToolCallEndEvent;
      case "citation":
        return { type: "citation", data: eventData } as SSECitationEvent;
      case "usage":
        return { type: "usage", data: eventData } as SSEUsageEvent;
      case "done":
        return { type: "done", data: eventData } as SSEDoneEvent;
      case "error":
        return { type: "error", data: eventData } as SSEErrorEvent;
      default:
        console.warn(`Unknown SSE event type: ${eventType}`);
        return null;
    }
  } catch (error) {
    console.error("Failed to parse SSE event:", error);
    return null;
  }
}

/**
 * Handles an SSE event by calling the appropriate callback
 */
function handleSSEEvent(event: SSEEvent, callbacks: StreamCallbacks): void {
  switch (event.type) {
    case "content":
      callbacks.onContent?.(event.data.text);
      break;
    case "tool_call_start":
      callbacks.onToolCallStart?.(event.data.id, event.data.tool);
      break;
    case "tool_call_end":
      callbacks.onToolCallEnd?.(
        event.data.id,
        event.data.tool,
        event.data.output,
        event.data.error
      );
      break;
    case "citation":
      callbacks.onCitation?.(
        event.data.source,
        event.data.source_ref,
        event.data.reference
      );
      break;
    case "usage":
      callbacks.onUsage?.(
        event.data.input_tokens,
        event.data.output_tokens,
        event.data.total_tokens,
        event.data.cost_usd
      );
      break;
    case "done":
      callbacks.onDone?.(event.data.message_id);
      break;
    case "error":
      callbacks.onError?.(event.data.code, event.data.message);
      break;
  }
}

/**
 * Sends a message and streams the response using SSE
 */
export async function streamMessage(
  sessionId: string,
  request: SendMessageRequest,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const url = `${BACKEND_URL}/v1/sessions/${sessionId}/messages`;

  const makeRequest = () =>
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        "X-CSRF-Token": getCsrfToken(),
      },
      body: JSON.stringify(request),
      credentials: "include",
      signal,
    });

  let response = await makeRequest();

  // Handle 401 by attempting token refresh
  if (response.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      response = await makeRequest();
    } else {
      // Redirect to login if refresh failed
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
      throw new Error("Session expired");
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorMessage;
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  if (!response.body) {
    throw new Error("Response body is null");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let currentEventType = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmedLine = line.trim();

        if (!trimmedLine) {
          // Empty line indicates end of event
          currentEventType = "";
          continue;
        }

        if (trimmedLine.startsWith("event:")) {
          currentEventType = trimmedLine.slice(6).trim();
        } else if (trimmedLine.startsWith("data:")) {
          const data = trimmedLine.slice(5).trim();
          if (currentEventType && data) {
            const event = parseSSEEvent(currentEventType, data);
            if (event) {
              handleSSEEvent(event, callbacks);
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Creates an AbortController for cancelling streams
 */
export function createStreamController(): AbortController {
  return new AbortController();
}
