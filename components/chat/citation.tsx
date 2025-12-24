"use client";

import { ExternalLink } from "lucide-react";
import type { Citation } from "@/lib/types";

interface CitationDisplayProps {
  citation: Citation;
}

export function CitationDisplay({ citation }: CitationDisplayProps) {
  return (
    <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
      <ExternalLink className="h-3 w-3 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="font-medium text-foreground truncate">
          {citation.source}
        </div>
        {citation.source_ref && (
          <div className="text-muted-foreground truncate">
            {citation.source_ref}
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
