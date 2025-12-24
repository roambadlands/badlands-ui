"use client";

import { useEffect, useRef } from "react";
import { Bot } from "lucide-react";
import { MessageItem } from "./message-item";
import type { Message, ToolCall, Citation } from "@/lib/types";

interface MessageListProps {
  messages: Message[];
  isStreaming?: boolean;
  streamingContent?: string;
  streamingToolCalls?: ToolCall[];
  streamingCitations?: Citation[];
}

export function MessageList({
  messages,
  isStreaming,
  streamingContent,
  streamingToolCalls,
  streamingCitations,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingContent]);

  // Create a streaming message placeholder
  const streamingMessage: Message | null =
    isStreaming && streamingContent
      ? {
          id: "streaming",
          role: "assistant",
          content: streamingContent,
          created_at: new Date().toISOString(),
        }
      : null;

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      <div className="divide-y divide-border">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}

        {/* Show thinking indicator when streaming but no content yet */}
        {isStreaming && !streamingContent && streamingToolCalls?.length === 0 && (
          <div className="flex gap-4 p-4 bg-muted/50">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm mb-1">Assistant</div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className="inline-block w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="inline-block w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="inline-block w-2 h-2 bg-primary rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}

        {streamingMessage && (
          <MessageItem
            message={streamingMessage}
            isStreaming={true}
            streamingContent={streamingContent}
            toolCalls={streamingToolCalls}
            citations={streamingCitations}
          />
        )}

        {messages.length === 0 && !isStreaming && (
          <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground">
            Start a conversation by sending a message
          </div>
        )}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
