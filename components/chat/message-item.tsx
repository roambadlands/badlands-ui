"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";
import { User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { sanitizeOptions } from "@/lib/markdown";
import { CodeBlock } from "./code-block";
import { ToolCallDisplay } from "./tool-call";
import { CitationDisplay } from "./citation";
import type { Message, ToolCall, Citation } from "@/lib/types";

import "highlight.js/styles/github-dark.css";

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
  streamingContent?: string;
  toolCalls?: ToolCall[];
  citations?: Citation[];
}

export function MessageItem({
  message,
  isStreaming,
  streamingContent,
  toolCalls,
  citations,
}: MessageItemProps) {
  const isUser = message.role === "user";
  const content = isStreaming ? streamingContent : message.content;
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

        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, [rehypeSanitize, sanitizeOptions]]}
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
                return (
                  <CodeBlock
                    className={className}
                    language={langMatch?.[1]}
                  >
                    {String(children).replace(/\n$/, "")}
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
                    className="text-primary hover:underline"
                  >
                    {children}
                  </a>
                );
              },
            }}
          >
            {content || ""}
          </ReactMarkdown>

          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
          )}
        </div>

        {displayCitations.length > 0 && (
          <div className="mt-4 space-y-2">
            {displayCitations.map((citation, index) => (
              <CitationDisplay key={index} citation={citation} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
