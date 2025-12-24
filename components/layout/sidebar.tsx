"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, MessageSquare, Trash2, MoreHorizontal, Pencil, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
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
      <div className="w-64 border-r border-border flex flex-col h-full bg-sidebar">
        <div className="p-4">
          <Button onClick={onNewChat} className="w-full gap-2">
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        <ScrollArea className="flex-1 px-2">
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
            <div className="space-y-1 p-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent cursor-pointer",
                    activeSessionId === session.id &&
                      "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                  onClick={() => onSelectSession(session.id)}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <div className="flex-1 overflow-hidden">
                    <div className="truncate">
                      {session.title || "New Chat"}
                    </div>
                    <div
                      className="text-xs text-muted-foreground"
                      title={formatFullDateTime(session.created_at)}
                    >
                      {formatDate(session.created_at)}
                    </div>
                  </div>
                  <Popover
                    open={renameSessionId === session.id}
                    onOpenChange={(open) => {
                      if (!open) handleRenameClose();
                    }}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <PopoverTrigger asChild>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRenameClick(session);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                        </PopoverTrigger>
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
                    <PopoverContent
                      align="start"
                      side="right"
                      className="w-80"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Rename Session</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={handleRenameClose}
                            aria-label="Close"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
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
                              className="text-xs text-destructive"
                            >
                              {renameError}
                            </p>
                          )}
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRenameClose}
                            disabled={isRenaming}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
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
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
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
    </>
  );
}
