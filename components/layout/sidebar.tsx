"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, MessageSquare, Trash2, MoreHorizontal, Pencil, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Session } from "@/lib/types";

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  isLoading: boolean;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, title: string) => Promise<void>;
  isRenaming?: boolean;
  width?: number;
}

export function Sidebar({
  sessions,
  activeSessionId,
  isLoading,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  isRenaming = false,
  width,
}: SidebarProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [renameSessionId, setRenameSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const handleDeleteClick = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (sessionToDelete) {
      onDeleteSession(sessionToDelete);
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  const handleRenameClick = (session: Session) => {
    setRenameSessionId(session.id);
    setRenameValue(session.title || "");
    setRenameError(null);
  };

  const handleRenameClose = () => {
    setRenameSessionId(null);
    setRenameValue("");
    setRenameError(null);
  };

  const handleRenameSubmit = async () => {
    if (!renameSessionId) return;

    const trimmedValue = renameValue.trim();

    if (!trimmedValue) {
      setRenameError("Title cannot be empty");
      return;
    }

    if (trimmedValue.length > 255) {
      setRenameError("Title cannot exceed 255 characters");
      return;
    }

    try {
      await onRenameSession(renameSessionId, trimmedValue);
      handleRenameClose();
    } catch {
      setRenameError("Failed to rename session");
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleRenameClose();
    }
  };

  // Focus and select input when popover opens
  useEffect(() => {
    if (renameSessionId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renameSessionId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    // Normalize to start of day (midnight) for calendar day comparison
    const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffDays = Math.round(
      (nowDay.getTime() - dateDay.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatFullDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div
        className="border-r border-border flex flex-col h-full bg-sidebar flex-shrink-0 overflow-hidden"
        style={{ width: width ? `${width}px` : "256px" }}
      >
        <div className="p-4">
          <Button onClick={onNewChat} className="w-full gap-2">
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No conversations yet
            </div>
          ) : (
            <div className="py-2 px-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "group relative rounded-lg text-sm transition-colors hover:bg-sidebar-accent cursor-pointer mb-1",
                    activeSessionId === session.id &&
                      "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                  onClick={() => onSelectSession(session.id)}
                >
                  {/* Content area */}
                  <div className="flex items-center gap-2 py-2 pl-3 pr-8 overflow-hidden">
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <div className="overflow-hidden min-w-0">
                      <div className="truncate text-sm">
                        {session.title || "New Chat"}
                      </div>
                      <div
                        className="text-xs text-muted-foreground truncate"
                        title={formatFullDateTime(session.created_at)}
                      >
                        {formatDate(session.created_at)}
                      </div>
                    </div>
                  </div>
                  {/* Menu button - overlaps content, always at right edge */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "absolute right-0 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground",
                          "bg-sidebar hover:bg-accent",
                          "group-hover:bg-sidebar-accent group-hover:hover:bg-accent",
                          activeSessionId === session.id && "bg-sidebar-accent"
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameClick(session);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(session.id);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this conversation? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={renameSessionId !== null}
        onOpenChange={(open) => {
          if (!open) handleRenameClose();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Session</DialogTitle>
            <DialogDescription>
              Enter a new name for this conversation.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              ref={renameInputRef}
              value={renameValue}
              onChange={(e) => {
                setRenameValue(e.target.value);
                setRenameError(null);
              }}
              onKeyDown={handleRenameKeyDown}
              placeholder="Enter session title"
              maxLength={255}
              disabled={isRenaming}
              aria-label="Session title"
              aria-invalid={!!renameError}
              aria-describedby={renameError ? "rename-error" : undefined}
            />
            {renameError && (
              <p
                id="rename-error"
                className="text-xs text-destructive mt-2"
              >
                {renameError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleRenameClose}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameSubmit}
              disabled={isRenaming || !renameValue.trim()}
            >
              {isRenaming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
