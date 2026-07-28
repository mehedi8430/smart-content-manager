"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronRight, ExternalLink } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useChatSessionsList,
  useCreateChatSession,
  useDeleteChatSession,
} from "@/hooks/server-state/use-chat-sessions";
import { toast } from "sonner";

interface ChatDropdownMenuProps {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  campaignId: string | undefined;
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
}

export function ChatDropdownMenu({
  menuOpen,
  setMenuOpen,
  campaignId,
  activeSessionId,
  setActiveSessionId,
}: ChatDropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(
    null,
  );

  const {
    data: sessions,
    isLoading,
    isError,
  } = useChatSessionsList(campaignId);
  const createSession = useCreateChatSession();
  const deleteSession = useDeleteChatSession(deletingSessionId ?? "");

  const handleNewChat = async () => {
    if (!campaignId) return;
    try {
      const session = await createSession.mutateAsync(campaignId);
      setActiveSessionId(session.id);
      setMenuOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start a new chat",
      );
    }
  };

  const handleDeleteSession = async (
    e: React.MouseEvent<HTMLButtonElement>,
    sessionId: string,
  ) => {
    e.stopPropagation();
    try {
      setDeletingSessionId(sessionId);
      await deleteSession.mutateAsync();
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
      }
      toast.success("Chat deleted successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete chat",
      );
    } finally {
      setDeletingSessionId(null);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, setMenuOpen]);

  if (!menuOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-12 z-50 w-64 rounded-lg border border-border bg-background shadow-lg"
    >
      <div className="flex flex-col">
        {/* Recent Chats Header */}
        <div className="border-b border-border px-4 py-2">
          <p className="text-xs font-semibold text-muted-foreground">
            Recent chats
          </p>
        </div>

        {/* Chat List */}
        <ScrollArea className="max-h-64">
          <div className="flex flex-col">
            {isLoading ? (
              <div className="px-4 py-2 text-xs text-muted-foreground">
                Loading...
              </div>
            ) : isError ? (
              <div className="px-4 py-2 text-xs text-muted-foreground">
                Failed to load
              </div>
            ) : sessions && sessions.length > 0 ? (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onMouseEnter={() => setHoveredSessionId(session.id)}
                  onMouseLeave={() => setHoveredSessionId(null)}
                  className="flex items-center border-b border-border/50 hover:bg-accent"
                >
                  <button
                    onClick={() => {
                      setActiveSessionId(session.id);
                      setMenuOpen(false);
                    }}
                    className="flex flex-1 items-center gap-2 px-4 py-3 text-left text-sm"
                  >
                    <div className="flex size-5 items-center justify-center rounded text-xs">
                      ≡
                    </div>
                    <span className="flex-1 truncate text-xs">
                      {session.title || "Untitled"}
                    </span>
                  </button>
                  {hoveredSessionId === session.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteSession(e, session.id)}
                      disabled={deletingSessionId === session.id}
                      className="mr-2 size-6 p-0 hover:bg-destructive/20"
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-xs text-muted-foreground">
                No chats yet
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Menu Items */}
        <div className="border-t border-border">
          <button className="flex w-full items-center justify-between px-4 py-2 text-xs text-muted-foreground hover:bg-accent">
            <span>More</span>
            <ChevronRight className="size-3" />
          </button>
        </div>

        <div className="border-t border-border">
          <button
            onClick={handleNewChat}
            disabled={createSession.isPending}
            className="flex w-full items-center gap-2 px-4 py-2 text-xs text-muted-foreground hover:bg-accent disabled:opacity-50"
          >
            <ExternalLink className="size-3" />
            <span>{createSession.isPending ? "Creating..." : "New chat"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
