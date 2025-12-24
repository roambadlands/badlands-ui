"use client";

import { Loader2 } from "lucide-react";
import { useElapsedTime } from "@/hooks/use-elapsed-time";
import { PHASE_LABELS, type ProgressPhase } from "@/lib/types";

interface ProgressIndicatorProps {
  phase: ProgressPhase;
  startedAt: number;
  toolName?: string;
  iteration?: number;
}

export function ProgressIndicator({ phase, startedAt, toolName, iteration }: ProgressIndicatorProps) {
  const elapsed = useElapsedTime(startedAt);

  // Build dynamic label based on phase and metadata
  let label = PHASE_LABELS[phase] || phase;
  if (phase === "calling_tool" && toolName) {
    label = `Calling ${toolName}`;
  } else if (phase === "iteration" && iteration) {
    label = `Step ${iteration}`;
  }

  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>
        {label}
        <span className="ml-1 tabular-nums">({elapsed.toFixed(1)}s)</span>
      </span>
    </div>
  );
}
