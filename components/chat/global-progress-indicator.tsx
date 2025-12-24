"use client";

import { Loader2 } from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { useElapsedTime } from "@/hooks/use-elapsed-time";
import { PHASE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

export function GlobalProgressIndicator() {
  const { isStreaming, currentPhase, phaseStartedAt } = useChatStore();
  const elapsed = useElapsedTime(phaseStartedAt ?? 0);

  const isVisible = isStreaming && currentPhase && phaseStartedAt;
  const label = currentPhase ? (PHASE_LABELS[currentPhase] || currentPhase) : "";

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-background/95 backdrop-blur border border-border px-4 py-2 shadow-lg transition-all duration-300",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2 pointer-events-none"
      )}
    >
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">
        {label}
        <span className="ml-1 tabular-nums">({elapsed.toFixed(1)}s)</span>
      </span>
    </div>
  );
}
