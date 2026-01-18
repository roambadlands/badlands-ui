import { BrowserContext } from "@playwright/test";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export interface LoginOptions {
  email: string;
  name: string;
}

export interface LoginResult {
  tenantId: string;
  email: string;
  name: string;
}

/**
 * Authenticates a test user via the backend's test-login endpoint.
 * Sets auth cookies on the browser context.
 *
 * Requires TEST_MODE=true on the backend.
 */
export async function login(
  context: BrowserContext,
  options: LoginOptions
): Promise<LoginResult> {
  const response = await fetch(`${BACKEND_URL}/v1/auth/test-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: options.email,
      name: options.name,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Test login failed (${response.status}): ${errorText}. ` +
        `Make sure the backend is running with TEST_MODE=true`
    );
  }

  // Parse cookies from response headers
  const setCookieHeaders = response.headers.getSetCookie();
  const cookies = parseCookies(setCookieHeaders);

  // Add cookies to browser context
  // Playwright requires either url or (domain + path)
  await context.addCookies(
    cookies.map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
      path: cookie.path || "/",
      domain: "localhost",
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
    }))
  );

  const data = await response.json();

  return {
    tenantId: data.tenant_id,
    email: data.email,
    name: data.name,
  };
}

/**
 * Logs out the current user by clearing auth cookies.
 */
export async function logout(context: BrowserContext): Promise<void> {
  await context.clearCookies();
}

interface ParsedCookie {
  name: string;
  value: string;
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

/**
 * Parses Set-Cookie headers into cookie objects.
 */
function parseCookies(setCookieHeaders: string[]): ParsedCookie[] {
  return setCookieHeaders.map((header) => {
    const parts = header.split(";").map((p) => p.trim());
    const [nameValue, ...attributes] = parts;
    const [name, value] = nameValue.split("=");

    const cookie: ParsedCookie = {
      name,
      value,
    };

    for (const attr of attributes) {
      const [attrName, attrValue] = attr.split("=");
      const lowerAttrName = attrName.toLowerCase();

      if (lowerAttrName === "path") {
        cookie.path = attrValue;
      } else if (lowerAttrName === "httponly") {
        cookie.httpOnly = true;
      } else if (lowerAttrName === "secure") {
        cookie.secure = true;
      } else if (lowerAttrName === "samesite") {
        const sameSiteValue = attrValue?.toLowerCase();
        if (sameSiteValue === "strict") cookie.sameSite = "Strict";
        else if (sameSiteValue === "lax") cookie.sameSite = "Lax";
        else if (sameSiteValue === "none") cookie.sameSite = "None";
      }
    }

    return cookie;
  });
}
