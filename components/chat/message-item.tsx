"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkMath from "remark-math";
import remarkEmoji from "remark-emoji";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeSanitize from "rehype-sanitize";
import { User, Bot, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { sanitizeOptions, convertAsciiTablesToMarkdown } from "@/lib/markdown";
import { CodeBlock } from "./code-block";
import { MermaidDiagram } from "./mermaid-diagram";
import { ToolCallDisplay } from "./tool-call";
import { CitationDisplay } from "./citation";
import type { Message, ToolCall, Citation } from "@/lib/types";

import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
  streamingContent?: string;
  toolCalls?: ToolCall[];
  citations?: Citation[];
  responseTimeMs?: number;
}

export function MessageItem({
  message,
  isStreaming,
  streamingContent,
  toolCalls,
  citations,
  responseTimeMs,
}: MessageItemProps) {
  const isUser = message.role === "user";
  const rawContent = isStreaming ? streamingContent : message.content;
  // Convert ASCII-art tables to proper markdown tables for rendering
  const content = rawContent ? convertAsciiTablesToMarkdown(rawContent) : "";
  const displayToolCalls = toolCalls || message.tool_calls || [];
  const displayCitations = citations || message.citations || [];

  return (
    <div
      className={cn(
        "flex gap-4 p-4",
        isUser ? "bg-background" : "bg-muted/50"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-5 w-5" />
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="font-medium text-sm mb-1">
          {isUser ? "You" : "Assistant"}
        </div>

        {!isUser && displayToolCalls.length > 0 && (
          <div className="mb-4 space-y-2">
            {displayToolCalls.map((toolCall) => (
              <ToolCallDisplay key={toolCall.id} toolCall={toolCall} />
            ))}
          </div>
        )}

        {displayCitations.length > 0 && (
          <div className="mb-4 space-y-2">
            {displayCitations.map((citation, index) => (
              <CitationDisplay key={index} citation={citation} />
            ))}
          </div>
        )}

        <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-transparent prose-pre:p-0">
          <ReactMarkdown
            remarkPlugins={[
              remarkGfm,
              remarkBreaks,
              remarkMath,
              [remarkEmoji, { accessible: true }],
            ]}
            rehypePlugins={[
              rehypeHighlight,
              rehypeKatex,
              [rehypeSanitize, sanitizeOptions],
            ]}
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.test(className || "");
                const isInline = !match && !className;

                if (isInline) {
                  return (
                    <code
                      className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }

                const langMatch = className?.match(/language-(\w+)/);
                const language = langMatch?.[1];
                const codeContent = String(children).replace(/\n$/, "");

                // Handle Mermaid diagrams
                if (language === "mermaid") {
                  return <MermaidDiagram>{codeContent}</MermaidDiagram>;
                }

                return (
                  <CodeBlock className={className} language={language}>
                    {codeContent}
                  </CodeBlock>
                );
              },
              pre({ children }) {
                return <>{children}</>;
              },
              a({ href, children }) {
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    {children}
                  </a>
                );
              },
              // Task list checkboxes
              input({ type, checked, ...props }) {
                if (type === "checkbox") {
                  return (
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled
                      className="mr-2 h-4 w-4 rounded border-border accent-primary cursor-default"
                      {...props}
                    />
                  );
                }
                return <input type={type} {...props} />;
              },
              // Task list items
              li({ children, className, ...props }) {
                const isTaskListItem = className?.includes("task-list-item");
                return (
                  <li
                    className={cn(
                      isTaskListItem && "list-none flex items-start gap-0",
                      className
                    )}
                    {...props}
                  >
                    {children}
                  </li>
                );
              },
              // Collapsible details/summary
              details({ children, ...props }) {
                return (
                  <details
                    className="my-4 rounded-lg border border-border bg-muted/30 group"
                    {...props}
                  >
                    {children}
                  </details>
                );
              },
              summary({ children, ...props }) {
                return (
                  <summary
                    className="cursor-pointer px-4 py-2 font-medium hover:bg-muted/50 rounded-t-lg list-none flex items-center gap-2"
                    {...props}
                  >
                    <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                    {children}
                  </summary>
                );
              },
              // Image with loading state and error handling
              img({ src, alt, ...props }) {
                return (
                  <span className="block my-4">
                    <img
                      src={src}
                      alt={alt || ""}
                      loading="lazy"
                      className="max-w-full h-auto rounded-lg border border-border"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        target.insertAdjacentHTML(
                          "afterend",
                          `<span class="text-muted-foreground text-sm italic">Image failed to load</span>`
                        );
                      }}
                      {...props}
                    />
                    {alt && (
                      <span className="block text-center text-sm text-muted-foreground mt-2">
                        {alt}
                      </span>
                    )}
                  </span>
                );
              },
              table({ children }) {
                return (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border-collapse border border-border">
                      {children}
                    </table>
                  </div>
                );
              },
              th({ children }) {
                return (
                  <th className="border border-border bg-muted px-3 py-2 text-left font-semibold">
                    {children}
                  </th>
                );
              },
              td({ children }) {
                return (
                  <td className="border border-border px-3 py-2">
                    {children}
                  </td>
                );
              },
              // Footnote styling
              sup({ children, ...props }) {
                return (
                  <sup
                    className="text-xs text-primary hover:underline cursor-pointer"
                    {...props}
                  >
                    {children}
                  </sup>
                );
              },
              // Section with footnotes
              section({ className, children, ...props }) {
                const isFootnotes = className?.includes("footnotes");
                if (isFootnotes) {
                  return (
                    <section
                      className="mt-8 pt-4 border-t border-border text-sm text-muted-foreground"
                      {...props}
                    >
                      <p className="font-medium text-foreground mb-2">Footnotes</p>
                      {children}
                    </section>
                  );
                }
                return (
                  <section className={className} {...props}>
                    {children}
                  </section>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {!isUser && responseTimeMs !== undefined && (
          <div className="mt-2 text-xs text-muted-foreground">
            {responseTimeMs < 1000
              ? `${responseTimeMs}ms`
              : `${(responseTimeMs / 1000).toFixed(1)}s`}
          </div>
        )}
      </div>
    </div>
  );
}
