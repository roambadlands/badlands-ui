"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkMath from "remark-math";
import remarkEmoji from "remark-emoji";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeSanitize from "rehype-sanitize";
import { User, Bot, ChevronRight, Copy, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { sanitizeOptions, convertAsciiTablesToMarkdown } from "@/lib/markdown";
import { CodeBlock } from "./code-block";
import { MermaidDiagram } from "./mermaid-diagram";
import { ToolCallDisplay } from "./tool-call";
import { CitationDisplay } from "./citation";
import { ContentBlockRenderer } from "./content-block-renderer";
import { parseMarkdownToBlocks } from "@/lib/markdown-parser";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { Message, ToolCall, Citation, ContentBlock as ContentBlockType } from "@/lib/types";

import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";

/**
 * Calculate the remaining content that hasn't been parsed into blocks yet.
 * This finds the text after the last completed block to show as in-progress content.
 */
function calculateRemainingContent(fullContent: string, blocks: ContentBlockType[]): string {
  if (!fullContent || blocks.length === 0) return fullContent;

  // Reconstruct the text covered by all blocks
  let consumedLength = 0;

  for (const block of blocks) {
    // Find where this block's content appears in the full content
    let blockText = "";

    switch (block.type) {
      case "text":
        blockText = block.text;
        break;
      case "code":
        // Code blocks in markdown are fenced: ```lang\ncode\n```
        blockText = "```" + (block.language || "") + "\n" + block.code + "\n```";
        break;
      case "heading":
        blockText = "#".repeat(block.level) + " " + block.text;
        break;
      case "list":
        blockText = block.items
          .map((item, i) => (block.ordered ? `${i + 1}. ${item}` : `- ${item}`))
          .join("\n");
        break;
      case "blockquote":
        blockText = block.text
          .split("\n")
          .map((line) => `> ${line}`)
          .join("\n");
        break;
      case "table":
        // Simplified table reconstruction
        const headerRow = "| " + block.headers.join(" | ") + " |";
        const separator = "| " + block.headers.map(() => "---").join(" | ") + " |";
        const dataRows = block.rows.map((row) => "| " + row.join(" | ") + " |").join("\n");
        blockText = [headerRow, separator, dataRows].join("\n");
        break;
      case "hr":
        blockText = "---";
        break;
      case "math":
        // Math blocks use $...$ for inline or $$...$$ for display
        blockText = block.inline ? `$${block.math}$` : `$$${block.math}$$`;
        break;
      case "tasklist":
        blockText = block.tasks
          .map((task) => `- [${task.checked ? "x" : " "}] ${task.text}`)
          .join("\n");
        break;
      case "callout":
        // GitHub-style callout: > [!TYPE]
        blockText = `> [!${block.callout_type}]\n> ${block.text}`;
        break;
      case "image":
        blockText = `![${block.image_alt || ""}](${block.image_url})`;
        break;
      case "details":
        // HTML details tag
        blockText = `<details>\n<summary>${block.text}</summary>\n</details>`;
        break;
    }

    // Find this block text in the remaining content (after consumed portion)
    const searchStart = consumedLength;
    const remaining = fullContent.substring(searchStart);
    const blockIndex = remaining.indexOf(blockText);

    if (blockIndex !== -1) {
      consumedLength = searchStart + blockIndex + blockText.length;
    } else {
      // Fallback: just use approximate length
      consumedLength += blockText.length;
    }
  }

  // Return everything after the consumed content
  // Skip leading whitespace/newlines for cleaner display
  const remaining = fullContent.substring(consumedLength);
  return remaining.replace(/^[\n\r]+/, "");
}

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
  streamingContent?: string;
  streamingContentBlocks?: ContentBlockType[];
  toolCalls?: ToolCall[];
  citations?: Citation[];
  responseTimeMs?: number;
  contentBlocks?: ContentBlockType[];
  onRetry?: () => void;
}

export function MessageItem({
  message,
  isStreaming,
  streamingContent,
  streamingContentBlocks,
  toolCalls,
  citations,
  responseTimeMs,
  contentBlocks,
  onRetry,
}: MessageItemProps) {
  const isUser = message.role === "user";
  const rawContent = isStreaming ? streamingContent : message.content;
  // Convert ASCII-art tables to proper markdown tables for rendering
  const content = rawContent ? convertAsciiTablesToMarkdown(rawContent) : "";
  const displayToolCalls = toolCalls || message.tool_calls || [];
  const displayCitations = citations || message.citations || [];
  const displayResponseTime = responseTimeMs ?? message.response_time_ms;

  // Use content blocks if available from backend, otherwise parse markdown into blocks
  const displayContentBlocks = contentBlocks || message.content_blocks;

  // Calculate content for streaming vs finalized rendering
  let completedBlocks: ContentBlockType[] = [];
  let inProgressContent = "";

  if (isStreaming) {
    // During streaming: use backend content blocks + remaining raw text
    if (streamingContentBlocks && streamingContentBlocks.length > 0) {
      completedBlocks = streamingContentBlocks;
      // Calculate the remaining text that hasn't been parsed into blocks yet
      inProgressContent = calculateRemainingContent(content, streamingContentBlocks);
    } else {
      // No content blocks yet, show raw content as in-progress
      inProgressContent = content;
    }
  } else {
    // Finalized message: use pre-parsed blocks from backend if available
    if (displayContentBlocks && displayContentBlocks.length > 0) {
      completedBlocks = displayContentBlocks;
    } else if (content) {
      completedBlocks = parseMarkdownToBlocks(content);
    }
  }

  const hasCompletedBlocks = completedBlocks.length > 0;
  const hasInProgressContent = inProgressContent.trim().length > 0;

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
          {isUser ? "You" : "Badlands AI"}
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

        {/* Render completed content blocks with rich formatting */}
        {hasCompletedBlocks && (
          <ContentBlockRenderer blocks={completedBlocks} />
        )}

        {/* Render in-progress content (during streaming) */}
        {hasInProgressContent && (
          <div className={cn(
            "prose prose-sm dark:prose-invert max-w-none prose-pre:bg-transparent prose-pre:p-0",
            hasCompletedBlocks && "mt-4"
          )}>
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
                        <p className="font-medium text-foreground mb-2">
                          Footnotes
                        </p>
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
              {inProgressContent}
            </ReactMarkdown>
          </div>
        )}

        <MessageFooter
          content={content}
          isUser={isUser}
          responseTimeMs={displayResponseTime}
          createdAt={message.created_at}
          onRetry={onRetry}
        />
      </div>
    </div>
  );
}

/**
 * Format elapsed time in a human-readable way.
 * Uses the most appropriate unit based on duration.
 */
function formatElapsedTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }

  const minutes = seconds / 60;
  if (minutes < 60) {
    const mins = Math.floor(minutes);
    const secs = Math.round(seconds % 60);
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }

  const hours = minutes / 60;
  const hrs = Math.floor(hours);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

/**
 * Format a date as a full human-readable string.
 */
function formatFullDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Footer for messages with copy button and response time (for assistant).
 */
function MessageFooter({
  content,
  isUser,
  responseTimeMs,
  createdAt,
  onRetry,
}: {
  content: string;
  isUser: boolean;
  responseTimeMs?: number;
  createdAt?: string;
  onRetry?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
      {!isUser && responseTimeMs !== undefined && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default">⏱️ {formatElapsedTime(responseTimeMs)}</span>
          </TooltipTrigger>
          <TooltipContent side="top">
            {createdAt ? formatFullDateTime(createdAt) : "Response time"}
          </TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleCopy}
            className="hover:text-foreground transition-colors cursor-pointer"
            aria-label="Copy message"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {copied ? "Copied!" : "Copy"}
        </TooltipContent>
      </Tooltip>
      {!isUser && onRetry && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onRetry}
              className="hover:text-foreground transition-colors cursor-pointer"
              aria-label="Try again"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            Try again
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
