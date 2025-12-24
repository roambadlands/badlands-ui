import { api } from "./api";

export type OAuthProvider = "google" | "discord" | "apple";

/**
 * Initiates OAuth login by redirecting to the backend OAuth endpoint
 */
export function loginWithOAuth(provider: OAuthProvider): void {
  const authUrl = api.getOAuthUrl(provider);
  window.location.href = authUrl;
}

/**
 * Logs out the user by calling the backend logout endpoint
 * and redirecting to the login page
 */
export async function logout(): Promise<void> {
  try {
    await api.logout();
  } catch (error) {
    // Log error but continue with redirect
    console.error("Logout error:", error);
  } finally {
    window.location.href = "/login";
  }
}

/**
 * Checks if the user is authenticated by calling the /auth/me endpoint
 * Returns the user data if authenticated, null otherwise
 */
export async function checkAuth() {
  try {
    const user = await api.getMe();
    return user;
  } catch {
    return null;
  }
}
