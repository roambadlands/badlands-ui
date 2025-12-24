"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";

interface MermaidDiagramProps {
  children: string;
  className?: string;
}

// Initialize mermaid with dark theme support
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "strict",
  fontFamily: "inherit",
});

let diagramId = 0;

export function MermaidDiagram({ children, className }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const idRef = useRef(`mermaid-${++diagramId}`);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;

      try {
        // Validate the diagram syntax first
        await mermaid.parse(children);

        // Render the diagram
        const { svg: renderedSvg } = await mermaid.render(idRef.current, children);

        // Sanitize SVG output with DOMPurify
        const sanitizedSvg = DOMPurify.sanitize(renderedSvg, {
          USE_PROFILES: { svg: true, svgFilters: true },
          ADD_TAGS: ["foreignObject"],
        });

        setSvg(sanitizedSvg);
        setError(null);
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        setError(err instanceof Error ? err.message : "Failed to render diagram");
        setSvg("");
      }
    };

    renderDiagram();
  }, [children]);

  if (error) {
    return (
      <div className={cn("my-4 rounded-lg bg-destructive/10 border border-destructive/20 p-4", className)}>
        <p className="text-sm text-destructive font-medium mb-2">Diagram Error</p>
        <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
          {children}
        </pre>
        <p className="text-xs text-destructive mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "my-4 flex justify-center overflow-x-auto rounded-lg bg-muted/50 p-4",
        className
      )}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
