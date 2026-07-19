"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ChatSidebar } from "./chat-sidebar";
import { ChatPanel } from "./chat-panel";
import { useChat } from "@/providers/chat-provider";

interface ChatDrawerProps {
  campaignId?: string;
  campaignName?: string;
  campaignNames?: Record<string, string>;
}

/**
 * Persistent chat assistant, rendered as a right-side Sheet drawer so it is
 * reachable from any dashboard route (campaign board, generate page, general
 * dashboard) without introducing a new navigation paradigm. Matches the
 * existing shadcn Sheet drawer pattern used elsewhere in the app.
 *
 * State (open/active session) lives in ChatProvider, so the drawer stays in
 * sync whether opened from the campaign "Ask the copilot" button or the
 * dashboard nav item.
 */
export function ChatDrawer({
  campaignId,
  campaignName,
  campaignNames,
}: ChatDrawerProps) {
  const { drawerOpen, setDrawerOpen, activeSessionId } = useChat();

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-md"
      >
        <div className="flex h-full">
          {/* Sidebar */}
          <aside className="hidden w-60 shrink-0 flex-col border-r border-border p-3 sm:flex">
            <ChatSidebar
              campaignId={campaignId}
              campaignName={campaignName}
              campaignNames={campaignNames}
            />
          </aside>

          {/* Panel */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {campaignName ? `Copilot · ${campaignName}` : "Campaign Copilot"}
                </p>
                <p className="text-xs text-muted-foreground">
                  AI assistant for your content
                </p>
              </div>
            </div>
            <ChatPanel activeSessionId={activeSessionId} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
