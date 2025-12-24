"use client";

import { type ReactNode, useState, useCallback, useEffect, useRef } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import type { Session } from "@/lib/types";

const MIN_SIDEBAR_WIDTH = 180;
const MAX_SIDEBAR_WIDTH = 480;
const DEFAULT_SIDEBAR_WIDTH = 256;
const STORAGE_KEY = "sidebar-width";

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
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Load saved width from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem(STORAGE_KEY);
    if (savedWidth) {
      const width = parseInt(savedWidth, 10);
      if (!isNaN(width) && width >= MIN_SIDEBAR_WIDTH && width <= MAX_SIDEBAR_WIDTH) {
        setSidebarWidth(width);
      }
    }
  }, []);

  // Save width to localStorage when it changes
  useEffect(() => {
    if (!isResizing) {
      localStorage.setItem(STORAGE_KEY, String(sidebarWidth));
    }
  }, [sidebarWidth, isResizing]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
        setSidebarWidth(newWidth);
      }
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add/remove event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

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
          width={sidebarWidth}
        />
        {/* Resize handle */}
        <div
          ref={resizeRef}
          className="w-1 hover:w-1 bg-transparent hover:bg-primary/50 cursor-col-resize transition-colors flex-shrink-0 relative group"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-primary/20" />
        </div>
        <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
