/**
 * Runtime environment configuration
 *
 * On the server: reads from process.env
 * On the client: reads from window.__ENV__ (injected at container startup)
 *
 * This allows env vars to be configured at runtime rather than build time.
 */

declare global {
  interface Window {
    __ENV__?: {
      NEXT_PUBLIC_BACKEND_URL?: string;
      NEXT_PUBLIC_APP_URL?: string;
    };
  }
}

const isServer = typeof window === "undefined";

function getEnv(key: string, fallback: string): string {
  if (isServer) {
    return process.env[key] || fallback;
  }
  return window.__ENV__?.[key as keyof typeof window.__ENV__] || fallback;
}

export const env = {
  get BACKEND_URL(): string {
    return getEnv("NEXT_PUBLIC_BACKEND_URL", "http://localhost:8080");
  },
  get APP_URL(): string {
    return getEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  },
};
