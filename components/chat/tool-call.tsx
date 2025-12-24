"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Wrench, Check, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolCall } from "@/lib/types";

interface ToolCallDisplayProps {
  toolCall: ToolCall;
}

function formatToolName(tool: string): string {
  // Remove "mcp__" or "mcp:" prefixes
  let formatted = tool.replace(/^mcp[_:]+/, "");
  // Replace double underscores with " - " for readability
  formatted = formatted.replace(/__/g, " - ");
  // Replace single underscores with spaces
  formatted = formatted.replace(/_/g, " ");
  return formatted;
}

export function ToolCallDisplay({ toolCall }: ToolCallDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayName = formatToolName(toolCall.tool);

  const statusIcon = {
    pending: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />,
    completed: <Check className="h-4 w-4 text-green-500" />,
    error: <AlertCircle className="h-4 w-4 text-destructive" />,
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        className="flex w-full items-center gap-2 p-3 text-left text-sm hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <Wrench className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{displayName}</span>
        <span className="ml-auto">{statusIcon[toolCall.status]}</span>
      </button>

      {isExpanded && (
        <div className="border-t border-border p-3 space-y-3">
          {toolCall.input && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Input
              </div>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                {JSON.stringify(toolCall.input, null, 2)}
              </pre>
            </div>
          )}

          {toolCall.output && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Output
              </div>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-48 overflow-y-auto">
                {JSON.stringify(toolCall.output, null, 2)}
              </pre>
            </div>
          )}

          {toolCall.error && (
            <div>
              <div className="text-xs font-medium text-destructive mb-1">
                Error
              </div>
              <pre className="text-xs bg-destructive/10 text-destructive p-2 rounded">
                {toolCall.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
