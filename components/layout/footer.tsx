"use client";

import { useStatus } from "@/lib/hooks/use-status";

export function Footer() {
  const { data: status, isLoading, isError } = useStatus();

  const frontendVersion = process.env.NEXT_PUBLIC_APP_VERSION || "unknown";

  return (
    <footer className="h-8 border-t border-border flex items-center justify-center px-4 text-xs text-muted-foreground bg-background">
      <div className="flex items-center gap-4">
        <span>UI v{frontendVersion}</span>
        <span className="text-border">|</span>
        {isLoading ? (
          <span className="animate-pulse">Loading...</span>
        ) : isError ? (
          <span>API unavailable</span>
        ) : (
          <span>
            API v{status?.version || "unknown"}
            {status?.dev_mode && (
              <span className="ml-1 text-yellow-500">(dev)</span>
            )}
          </span>
        )}
      </div>
    </footer>
  );
}
