"use client";

import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { usePathname } from "next/navigation";
import { ChatPanel } from "./chat-panel";
import { useChat } from "@/providers/chat-provider";
import { Button } from "@/components/ui/button";
import { MoreVertical, Trash2, ChevronRight, ExternalLink } from "lucide-react";
import { useChatSessionsList } from "@/hooks/server-state/use-chat-sessions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createChatSession, deleteChatSession } from "@/api/chat.api";
import { useQueryClient } from "@tanstack/react-query";
import { chatKeys } from "@/types/queryKeys";
import { toast } from "sonner";

const CAMPAIGN_ID_RE =
  /^\/dashboard\/campaigns\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

export function ChatDrawer() {
  const pathname = usePathname();
  const campaignMatch = pathname.match(CAMPAIGN_ID_RE);
  const campaignId = campaignMatch?.[1];

  const { drawerOpen, setDrawerOpen, activeSessionId, setActiveSessionId } = useChat();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const { data: sessions, isLoading, isError } = useChatSessionsList(campaignId);
  const queryClient = useQueryClient();
  const menuRef = useRef<HTMLDivElement>(null);

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
  }, [menuOpen]);

  const handleNewChat = async () => {
    try {
      setIsCreating(true);
      const session = await createChatSession(campaignId);
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
      setActiveSessionId(session.id);
      setMenuOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start a new chat",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSession = async (
    e: React.MouseEvent<HTMLButtonElement>,
    sessionId: string,
  ) => {
    e.stopPropagation();
    try {
      setDeletingSessionId(sessionId);
      await deleteChatSession(sessionId);
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
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

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-md"
      >
        <div className="flex h-full flex-col">
          {/* Header with menu button */}
          <div className="relative flex items-center justify-between border-b border-border px-4 py-3 pr-12">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                Campaign Copilot
              </p>
              <p className="text-xs text-muted-foreground">
                AI assistant for your content
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(!menuOpen)}
              className="shrink-0"
            >
              <MoreVertical className="size-4" />
            </Button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 top-12 z-50 w-64 rounded-lg border border-border bg-background shadow-lg"
              >
                <div className="flex flex-col">
                  {/* Recent Chats Header */}
                  <div className="border-b border-border px-4 py-2">
                    <p className="text-xs font-semibold text-muted-foreground">Recent chats</p>
                  </div>

                  {/* Chat List */}
                  <ScrollArea className="max-h-64">
                    <div className="flex flex-col">
                      {isLoading ? (
                        <div className="px-4 py-2 text-xs text-muted-foreground">Loading...</div>
                      ) : isError ? (
                        <div className="px-4 py-2 text-xs text-muted-foreground">Failed to load</div>
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
                              <div className="flex size-5 items-center justify-center rounded text-xs">≡</div>
                              <span className="flex-1 truncate text-xs">{session.title || "Untitled"}</span>
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
                        <div className="px-4 py-2 text-xs text-muted-foreground">No chats yet</div>
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
                      disabled={isCreating}
                      className="flex w-full items-center gap-2 px-4 py-2 text-xs text-muted-foreground hover:bg-accent disabled:opacity-50"
                    >
                      <ExternalLink className="size-3" />
                      <span>{isCreating ? "Creating..." : "New chat"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Panel - Full width */}
          <ChatPanel activeSessionId={activeSessionId} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
