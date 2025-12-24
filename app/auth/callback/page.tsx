"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    async function handleCallback() {
      // Check for error from OAuth flow
      const error = searchParams.get("error");
      if (error) {
        console.error("OAuth error:", error);
        router.push(`/login?error=${encodeURIComponent(error)}`);
        return;
      }

      // Extract CSRF token from URL and set as cookie
      // This is needed for cross-origin setups where frontend and backend
      // are on different origins and cookies cannot be shared
      // Note: Don't encode the token - it's already URL-safe base64 and the
      // backend expects the raw value
      const csrfToken = searchParams.get("csrf_token");
      if (csrfToken) {
        document.cookie = `csrf_token=${csrfToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      }

      // Refresh user data after OAuth callback
      // The backend has already set the cookies
      await refreshUser();

      // Redirect to chat
      router.push("/chat");
    }

    handleCallback();
  }, [searchParams, router, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
