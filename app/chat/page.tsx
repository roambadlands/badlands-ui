"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChatLayout } from "@/components/layout/chat-layout";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { GlobalProgressIndicator } from "@/components/chat/global-progress-indicator";
import { useSessions, useSession, useCreateSession, useDeleteSession } from "@/lib/hooks/use-sessions";
import { useSessionStore } from "@/store/session-store";
import { useChatStore } from "@/store/chat-store";
import { streamMessage } from "@/lib/streaming";
import { parseMarkdownToBlocks } from "@/lib/markdown-parser";
import type { Message } from "@/lib/types";

export default function ChatPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Session state
  const { activeSessionId, setActiveSession } = useSessionStore();

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
    getContentBlocks,
    streamingCitations,
  } = useChatStore();

  // API queries
  const { data: sessionsData, isLoading: isLoadingSessions } = useSessions();
  const { data: sessionData, isLoading: isLoadingSession } = useSession(activeSessionId);
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();

  const sessions = sessionsData?.sessions || [];
  const messages = sessionData?.messages || [];

  // Handle new chat
  const handleNewChat = useCallback(async () => {
    try {
      const newSession = await createSession.mutateAsync({ mode: "chat" });
      setActiveSession(newSession.id);
      router.push(`/chat/${newSession.id}`);
    } catch (error) {
      toast.error("Failed to create chat session");
    }
  }, [createSession, setActiveSession, router]);

  // Handle session selection
  const handleSelectSession = useCallback(
    (sessionId: string) => {
      setActiveSession(sessionId);
      router.push(`/chat/${sessionId}`);
    },
    [setActiveSession, router]
  );

  // Handle session deletion
  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      try {
        await deleteSession.mutateAsync(sessionId);
        if (activeSessionId === sessionId) {
          setActiveSession(null);
          router.push("/chat");
        }
      } catch (error) {
        toast.error("Failed to delete session");
      }
    },
    [deleteSession, activeSessionId, setActiveSession, router]
  );

  // Handle sending a message
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!activeSessionId) {
        // Create a new session first
        try {
          const newSession = await createSession.mutateAsync({ mode: "chat" });
          setActiveSession(newSession.id);
          router.push(`/chat/${newSession.id}`);

          // Add optimistic user message for the new session
          const userMessage: Message = {
            id: `temp-${Date.now()}`,
            role: "user",
            content,
            created_at: new Date().toISOString(),
          };

          queryClient.setQueryData(
            ["session", newSession.id],
            {
              ...newSession,
              messages: [userMessage],
            }
          );

          // Now send the message to the new session
          const controller = startStreaming();

          try {
            await streamMessage(
              newSession.id,
              { content },
              {
                onContent: appendContent,
                onToolCallStart: addToolCallStart,
                onToolCallEnd: updateToolCallEnd,
                onCitation: (source, sourceRef, reference) =>
                  addCitation({ source, source_ref: sourceRef, reference }),
                onDone: () => {
                  // Log the complete message before resetting
                  const state = useChatStore.getState();
                  const rawText = state.streamingContent;
                  const contentBlocks = parseMarkdownToBlocks(rawText);
                  console.log("[Assistant Message Complete] Raw text:", rawText);
                  console.log("[Assistant Message Complete] Content blocks:", contentBlocks);

                  resetStreaming();
                  queryClient.invalidateQueries({ queryKey: ["session", newSession.id] });
                  // Delay sessions invalidation to allow backend title generation to complete
                  setTimeout(() => {
                    queryClient.invalidateQueries({ queryKey: ["sessions"] });
                  }, 1500);
                },
                onError: (code, message) => {
                  toast.error(message || "Failed to get response");
                  resetStreaming();
                },
              },
              controller.signal
            );
          } catch (error) {
            if ((error as Error).name !== "AbortError") {
              toast.error((error as Error).message || "Failed to get response");
            }
            resetStreaming();
          }
        } catch (error) {
          toast.error("Failed to create chat session");
        }
        return;
      }

      // Add optimistic user message
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        role: "user",
        content,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData(
        ["session", activeSessionId],
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
          activeSessionId,
          { content },
          {
            onContent: appendContent,
            onToolCallStart: addToolCallStart,
            onToolCallEnd: updateToolCallEnd,
            onCitation: (source, sourceRef, reference) =>
              addCitation({ source, source_ref: sourceRef, reference }),
            onDone: () => {
              // Log the complete message before resetting
              const state = useChatStore.getState();
              const rawText = state.streamingContent;
              const contentBlocks = parseMarkdownToBlocks(rawText);
              console.log("[Assistant Message Complete] Raw text:", rawText);
              console.log("[Assistant Message Complete] Content blocks:", contentBlocks);

              resetStreaming();
              queryClient.invalidateQueries({ queryKey: ["session", activeSessionId] });
              // Delay sessions invalidation to allow backend title generation to complete
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["sessions"] });
              }, 1500);
            },
            onError: (code, message) => {
              toast.error(message || "Failed to get response");
              resetStreaming();
            },
          },
          controller.signal
        );
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          toast.error((error as Error).message || "Failed to get response");
        }
        resetStreaming();
      }
    },
    [
      activeSessionId,
      createSession,
      setActiveSession,
      router,
      startStreaming,
      appendContent,
      addToolCallStart,
      updateToolCallEnd,
      addCitation,
      resetStreaming,
      queryClient,
    ]
  );

  return (
    <ChatLayout
      sessions={sessions}
      activeSessionId={activeSessionId}
      isLoadingSessions={isLoadingSessions}
      onNewChat={handleNewChat}
      onSelectSession={handleSelectSession}
      onDeleteSession={handleDeleteSession}
    >
      <MessageList
        messages={messages}
        sessionId={activeSessionId}
        isStreaming={isStreaming}
        streamingContent={streamingContent}
        streamingContentBlocks={getContentBlocks()}
        streamingToolCalls={getToolCalls()}
        streamingCitations={streamingCitations}
        onSelectPrompt={handleSendMessage}
      />
      <GlobalProgressIndicator />
      <ChatInput
        onSend={handleSendMessage}
        onStop={stopStreaming}
        isStreaming={isStreaming}
        disabled={isLoadingSession}
      />
    </ChatLayout>
  );
}
