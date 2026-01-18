import type {
  AuthMeResponse,
  SessionsResponse,
  SessionWithMessages,
  Session,
  BudgetResponse,
  CreateSessionRequest,
  APIError,
  StatusResponse,
} from "./types";
import { env } from "./env";
import { addApiBreadcrumb, captureError, getTracingHeaders } from "./sentry";

class APIClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getCsrfToken(): string {
    // Read CSRF token from cookie (double-submit pattern)
    // Note: Token is stored without encoding, so read it directly
    if (typeof document === "undefined") {
      return "";
    }
    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
    return match ? match[1] : "";
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const csrfToken = this.getCsrfToken();
    const method = options.method || "GET";

    try {
      const response = await fetch(url, {
        ...options,
        credentials: "include", // Include cookies for auth
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
          ...getTracingHeaders(),
          ...options.headers,
        },
      });

      // Add breadcrumb for the request
      addApiBreadcrumb(method, endpoint, response.status);

      if (response.status === 401) {
        // Try to refresh the token
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the original request
          const retryResponse = await fetch(url, {
            ...options,
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": this.getCsrfToken(),
              ...getTracingHeaders(),
              ...options.headers,
            },
          });

          addApiBreadcrumb(method, endpoint, retryResponse.status);

          if (!retryResponse.ok) {
            const error = (await retryResponse.json()) as APIError;
            const errorMsg = error.error || "Request failed after token refresh";
            addApiBreadcrumb(method, endpoint, retryResponse.status, errorMsg);
            throw new Error(errorMsg);
          }

          return retryResponse.json() as Promise<T>;
        } else {
          // Redirect to login if refresh failed (but not if already on login)
          if (
            typeof window !== "undefined" &&
            !window.location.pathname.startsWith("/login")
          ) {
            window.location.href = "/login";
          }
          throw new Error("Session expired");
        }
      }

      if (!response.ok) {
        const error = (await response.json()) as APIError;
        const errorMsg =
          error.error || `Request failed with status ${response.status}`;
        addApiBreadcrumb(method, endpoint, response.status, errorMsg);
        throw new Error(errorMsg);
      }

      // Handle empty responses (e.g., DELETE)
      const text = await response.text();
      if (!text) {
        return {} as T;
      }

      return JSON.parse(text) as T;
    } catch (error) {
      // Capture unexpected errors (not session expiry which is handled)
      if (
        error instanceof Error &&
        !error.message.includes("Session expired")
      ) {
        captureError(error, { endpoint, method });
      }
      throw error;
    }
  }

  private async refreshToken(): Promise<boolean> {
    // Prevent multiple simultaneous refresh requests
    if (this.isRefreshing) {
      return this.refreshPromise || Promise.resolve(false);
    }

    this.isRefreshing = true;
    this.refreshPromise = this.doRefresh();

    try {
      return await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async doRefresh(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "X-CSRF-Token": this.getCsrfToken(),
          ...getTracingHeaders(),
        },
      });

      if (response.ok) {
        // Update CSRF token from response for cross-origin setups
        // Note: Don't encode the token - it's already URL-safe base64
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

  // Auth endpoints
  async getMe(): Promise<AuthMeResponse> {
    return this.fetch<AuthMeResponse>("/v1/auth/me");
  }

  async logout(): Promise<void> {
    await this.fetch<void>("/v1/auth/logout", { method: "POST" });
  }

  getOAuthUrl(provider: "google" | "discord" | "apple"): string {
    const redirectUri = encodeURIComponent(
      `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`
    );
    return `${this.baseUrl}/v1/auth/${provider}?redirect_uri=${redirectUri}`;
  }

  // Session endpoints
  async getSessions(limit = 50, offset = 0): Promise<SessionsResponse> {
    return this.fetch<SessionsResponse>(
      `/v1/sessions?limit=${limit}&offset=${offset}`
    );
  }

  async getSession(sessionId: string): Promise<SessionWithMessages> {
    return this.fetch<SessionWithMessages>(`/v1/sessions/${sessionId}`);
  }

  async createSession(data: CreateSessionRequest): Promise<Session> {
    return this.fetch<Session>("/v1/sessions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.fetch<void>(`/v1/sessions/${sessionId}`, {
      method: "DELETE",
    });
  }

  async updateSession(sessionId: string, data: { title: string }): Promise<Session> {
    return this.fetch<Session>(`/v1/sessions/${sessionId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Budget endpoints
  async getBudget(): Promise<BudgetResponse> {
    return this.fetch<BudgetResponse>("/v1/tenant/budget");
  }

  // Streaming endpoint - returns the URL for direct fetch
  getStreamUrl(sessionId: string): string {
    return `${this.baseUrl}/v1/sessions/${sessionId}/messages`;
  }

  // Status endpoint (no auth required)
  async getStatus(): Promise<StatusResponse> {
    return this.fetch<StatusResponse>("/status");
  }
}

// Export singleton instance with lazy initialization
// Uses getter to ensure env.BACKEND_URL is read at runtime, not module load time
let _api: APIClient | null = null;

function getApi(): APIClient {
  if (!_api) {
    _api = new APIClient(env.BACKEND_URL);
  }
  return _api;
}

export const api = new Proxy({} as APIClient, {
  get(_, prop: string | symbol) {
    const instance = getApi();
    const value = instance[prop as keyof APIClient];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

// Export class for testing
export { APIClient };
