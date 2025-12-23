"use client";

import { useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ChatLayout } from "@/components/layout/chat-layout";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { useSessions, useSession, useCreateSession, useDeleteSession } from "@/lib/hooks/use-sessions";
import { useSessionStore } from "@/store/session-store";
import { useChatStore } from "@/store/chat-store";
import { streamMessage } from "@/lib/streaming";
import type { Message } from "@/lib/types";

export default function ChatSessionPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionId = params.sessionId as string;

  // Session state
  const { setActiveSession } = useSessionStore();

  // Set active session from URL
  useEffect(() => {
    setActiveSession(sessionId);
  }, [sessionId, setActiveSession]);

  // Chat streaming state
  const {
    isStreaming,
    streamingContent,
    startStreaming,
    appendContent,
    addToolCallStart,
    updateToolCallEnd,
    addCitation,
    stopStreaming,
    resetStreaming,
    getToolCalls,
    streamingCitations,
  } = useChatStore();

  // API queries
  const { data: sessionsData, isLoading: isLoadingSessions } = useSessions();
  const { data: sessionData, isLoading: isLoadingSession, error: sessionError } = useSession(sessionId);
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();

  const sessions = sessionsData?.sessions || [];
  const messages = sessionData?.messages || [];

  // Redirect to /chat if session not found
  useEffect(() => {
    if (sessionError) {
      router.push("/chat");
    }
  }, [sessionError, router]);

  // Handle new chat
  const handleNewChat = useCallback(async () => {
    try {
      const newSession = await createSession.mutateAsync({ mode: "chat" });
      setActiveSession(newSession.id);
      router.push(`/chat/${newSession.id}`);
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  }, [createSession, setActiveSession, router]);

  // Handle session selection
  const handleSelectSession = useCallback(
    (selectedSessionId: string) => {
      setActiveSession(selectedSessionId);
      router.push(`/chat/${selectedSessionId}`);
    },
    [setActiveSession, router]
  );

  // Handle session deletion
  const handleDeleteSession = useCallback(
    async (deleteSessionId: string) => {
      try {
        await deleteSession.mutateAsync(deleteSessionId);
        if (sessionId === deleteSessionId) {
          setActiveSession(null);
          router.push("/chat");
        }
      } catch (error) {
        console.error("Failed to delete session:", error);
      }
    },
    [deleteSession, sessionId, setActiveSession, router]
  );

  // Handle sending a message
  const handleSendMessage = useCallback(
    async (content: string) => {
      // Add optimistic user message
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        role: "user",
        content,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData(
        ["session", sessionId],
        (old: typeof sessionData) =>
          old
            ? {
                ...old,
                messages: [...old.messages, userMessage],
              }
            : old
      );

      const controller = startStreaming();

      try {
        await streamMessage(
          sessionId,
          { content },
          {
            onContent: appendContent,
            onToolCallStart: addToolCallStart,
            onToolCallEnd: updateToolCallEnd,
            onCitation: (source, sourceRef, reference) =>
              addCitation({ source, source_ref: sourceRef, reference }),
            onDone: () => {
              resetStreaming();
              queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
              // Delay sessions invalidation to allow backend title generation to complete
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["sessions"] });
              }, 1500);
            },
            onError: (code, message) => {
              console.error(`Stream error [${code}]:`, message);
              resetStreaming();
            },
          },
          controller.signal
        );
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Stream error:", error);
        }
        resetStreaming();
      }
    },
    [
      sessionId,
      startStreaming,
      appendContent,
      addToolCallStart,
      updateToolCallEnd,
      addCitation,
      resetStreaming,
      queryClient,
      sessionData,
    ]
  );

  return (
    <ChatLayout
      sessions={sessions}
      activeSessionId={sessionId}
      isLoadingSessions={isLoadingSessions}
      onNewChat={handleNewChat}
      onSelectSession={handleSelectSession}
      onDeleteSession={handleDeleteSession}
    >
      <MessageList
        messages={messages}
        isStreaming={isStreaming}
        streamingContent={streamingContent}
        streamingToolCalls={getToolCalls()}
        streamingCitations={streamingCitations}
      />
      <ChatInput
        onSend={handleSendMessage}
        onStop={stopStreaming}
        isStreaming={isStreaming}
        disabled={isLoadingSession}
      />
    </ChatLayout>
  );
}
