"use client";

import { useEffect, useRef } from "react";
import { Bot } from "lucide-react";
import { MessageItem } from "./message-item";
import type { Message, ToolCall, Citation } from "@/lib/types";

// Store scroll positions outside component to persist across remounts
const scrollPositions = new Map<string, number>();

interface MessageListProps {
  messages: Message[];
  sessionId?: string | null;
  isStreaming?: boolean;
  streamingContent?: string;
  streamingToolCalls?: ToolCall[];
  streamingCitations?: Citation[];
}

export function MessageList({
  messages,
  sessionId,
  isStreaming,
  streamingContent,
  streamingToolCalls,
  streamingCitations,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMessageCount = useRef(0);

  // Save scroll position on every scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !sessionId) return;

    const handleScroll = () => {
      scrollPositions.set(sessionId, container.scrollTop);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [sessionId]);

  // Restore scroll position or default to bottom when session changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !sessionId) return;

    // Wait for messages to render
    const timer = setTimeout(() => {
      if (scrollPositions.has(sessionId)) {
        container.scrollTop = scrollPositions.get(sessionId)!;
      } else {
        // New session - scroll to bottom
        container.scrollTop = container.scrollHeight;
      }
    }, 100);

    lastMessageCount.current = 0;
    return () => clearTimeout(timer);
  }, [sessionId]);

  // Scroll to bottom when user sends a message
  useEffect(() => {
    const newCount = messages.length;
    const lastMessage = messages[newCount - 1];

    if (newCount > lastMessageCount.current && lastMessage?.role === "user") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    lastMessageCount.current = newCount;
  }, [messages]);

  // Create a streaming message placeholder
  // Show when streaming AND (has content OR has tool calls)
  const hasToolCalls = streamingToolCalls && streamingToolCalls.length > 0;
  const streamingMessage: Message | null =
    isStreaming && (streamingContent || hasToolCalls)
      ? {
          id: "streaming",
          role: "assistant",
          content: streamingContent || "",
          created_at: new Date().toISOString(),
        }
      : null;

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      <div className="divide-y divide-border">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            responseTimeMs={message.response_time_ms}
          />
        ))}

        {/* Show waiting indicator when streaming but no content yet */}
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
