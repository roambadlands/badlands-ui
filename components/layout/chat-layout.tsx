"use client";

import { type ReactNode } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import type { Session } from "@/lib/types";

interface ChatLayoutProps {
  children: ReactNode;
  sessions: Session[];
  activeSessionId: string | null;
  isLoadingSessions: boolean;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, title: string) => Promise<void>;
  isRenaming?: boolean;
}

export function ChatLayout({
  children,
  sessions,
  activeSessionId,
  isLoadingSessions,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  isRenaming,
}: ChatLayoutProps) {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          isLoading={isLoadingSessions}
          onNewChat={onNewChat}
          onSelectSession={onSelectSession}
          onDeleteSession={onDeleteSession}
          onRenameSession={onRenameSession}
          isRenaming={isRenaming}
        />
        <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
