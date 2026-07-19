"use client";

import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ReuseableAlertDialog from "@/components/reuseable-alert-dialog";
import { useChat } from "@/providers/chat-provider";
import { useDeleteChatSession } from "@/hooks/server-state/use-chat-sessions";
import { cn } from "@/lib/utils";
import type { ChatSessionSummary } from "@/types/chat.type";

interface ChatSidebarItemProps {
  session: ChatSessionSummary;
  campaignName?: string;
}

export function ChatSidebarItem({ session, campaignName }: ChatSidebarItemProps) {
  const { activeSessionId, setActiveSessionId } = useChat();
  const deleteSession = useDeleteChatSession(session.id);

  const isActive = activeSessionId === session.id;
  const title = session.title?.trim() || "New conversation";

  const handleDelete = async () => {
    // Await the mutation so the dialog doesn't close before the request resolves
    // (avoids fire-and-forget races per project convention).
    await deleteSession.mutateAsync();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-current={isActive}
      onClick={() => setActiveSessionId(session.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setActiveSessionId(session.id);
        }
      }}
      className={cn(
        "group relative flex cursor-pointer flex-col gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors",
        isActive
          ? "border-sidebar-primary/40 bg-sidebar-accent text-sidebar-accent-foreground"
          : "border-transparent hover:border-sidebar-border hover:bg-sidebar-accent/60",
      )}
    >
      <div className="flex items-start gap-2 pr-7">
        <MessageSquare className="mt-0.5 size-4 shrink-0 text-sidebar-foreground/60" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(session.updatedAt), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>

      {session.campaignId && (
        <div className="pl-6">
          <Badge
            variant="secondary"
            className="max-w-full truncate bg-sidebar-primary/10 text-sidebar-primary"
          >
            {campaignName || "Campaign"}
          </Badge>
        </div>
      )}

      <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <ReuseableAlertDialog
          title="Delete conversation?"
          description={`"${title}" will be permanently removed. This action cannot be undone.`}
          actionText="Delete"
          cancelText="Cancel"
          isLoading={deleteSession.isPending}
          onConfirm={handleDelete}
          trigger={
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Delete conversation"
              className="text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="size-3.5" />
            </Button>
          }
        />
      </div>
    </div>
  );
}
