"use client";

import { useChatSessionsList } from "@/hooks/server-state/use-chat-sessions";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatSidebarItem } from "./chat-sidebar-item";
import { NewChatButton } from "./new-chat-button";
import { MessagesSquare } from "lucide-react";

interface ChatSidebarProps {
  /**
   * Campaign scope when rendered on a campaign detail page. Omitted on the
   * general dashboard route.
   */
  campaignId?: string;
  campaignName?: string;
  /**
   * Lookup of campaignId -> name for the chips shown on each session.
   *
   * DESIGN CHOICE (flagged, not silently decided): the GET /chat/sessions
   * response is a light projection (no campaign name) by design — mirroring the
   * server's "keep the sidebar query cheap / no N+1" intent from Phase 1. Rather
   * than denormalizing `campaignName` into that endpoint, we accept a name
   * lookup here. On a campaign page there's exactly one campaign in scope, so a
   * single { [campaignId]: campaignName } entry suffices; on the general
   * dashboard we simply don't have names and the chip shows a neutral label.
   */
  campaignNames?: Record<string, string>;
}

export function ChatSidebar({
  campaignId,
  campaignName,
  campaignNames,
}: ChatSidebarProps) {
  // Read directly from the hook's query data — the sidebar list is NOT mirrored
  // into context state (per Phase 4). Server returns most-recent-first (updatedAt
  // desc), so no client re-sort is needed.
  const { data: sessions, isLoading, isError } = useChatSessionsList(campaignId);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="px-1">
        <NewChatButton campaignId={campaignId} campaignName={campaignName} />
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 pr-3">
          {isLoading ? (
            <ChatSidebarSkeleton />
          ) : isError ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              Couldn&apos;t load conversations.
            </p>
          ) : sessions && sessions.length > 0 ? (
            sessions.map((session) => (
              <ChatSidebarItem
                key={session.id}
                session={session}
                campaignName={
                  session.campaignId
                    ? campaignNames?.[session.campaignId] ?? campaignName
                    : undefined
                }
              />
            ))
          ) : (
            <ChatEmptyState />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function ChatSidebarSkeleton() {
  // Skeleton rows (not a spinner-over-blank-list), matching the Kanban board's
  // loading pattern for consistency.
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3, 4].map((row) => (
        <div
          key={row}
          className="flex flex-col gap-2 rounded-lg border border-transparent px-3 py-2.5"
        >
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 rounded-md" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="ml-6 h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

function ChatEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-primary">
        <MessagesSquare className="size-5" />
      </div>
      <p className="text-sm font-medium">No conversations yet</p>
      <p className="text-xs text-muted-foreground">
        Start a new chat to get AI help with your campaign.
      </p>
    </div>
  );
}
