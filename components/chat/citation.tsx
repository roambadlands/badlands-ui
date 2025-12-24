"use client";

import { ExternalLink } from "lucide-react";
import type { Citation } from "@/lib/types";

interface CitationDisplayProps {
  citation: Citation;
}

function formatSource(source: string): string {
  // Hide "mcp" as a source, use "Tool" instead
  if (source === "mcp") return "Tool";
  return source;
}

function formatSourceRef(sourceRef: string): string {
  // Remove "mcp:" prefix and format tool names nicely
  let formatted = sourceRef.replace(/^mcp:/, "");
  // Replace double underscores with " - " for readability
  formatted = formatted.replace(/__/g, " - ");
  // Replace single underscores with spaces
  formatted = formatted.replace(/_/g, " ");
  return formatted;
}

export function CitationDisplay({ citation }: CitationDisplayProps) {
  const displaySource = formatSource(citation.source);
  const displaySourceRef = citation.source_ref ? formatSourceRef(citation.source_ref) : null;

  return (
    <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
      <ExternalLink className="h-3 w-3 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="font-medium text-foreground truncate">
          {displaySource}
        </div>
        {displaySourceRef && (
          <div className="text-muted-foreground truncate">
            {displaySourceRef}
          </div>
        )}
        {citation.reference && (
          <div className="mt-1 text-foreground/80 line-clamp-2">
            {citation.reference}
          </div>
        )}
      </div>
    </div>
  );
}
