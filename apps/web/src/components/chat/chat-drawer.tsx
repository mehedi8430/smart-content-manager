"use client";

import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { usePathname } from "next/navigation";
import { ChatSidebar } from "./chat-sidebar";
import { ChatPanel } from "./chat-panel";
import { useChat } from "@/providers/chat-provider";
import { Button } from "@/components/ui/button";
import { MoreVertical, X } from "lucide-react";

const CAMPAIGN_ID_RE =
  /^\/dashboard\/campaigns\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

export function ChatDrawer() {
  const pathname = usePathname();
  const campaignMatch = pathname.match(CAMPAIGN_ID_RE);
  const campaignId = campaignMatch?.[1];

  const { drawerOpen, setDrawerOpen, activeSessionId } = useChat();
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-md"
      >
        <div className="flex h-full flex-col">
          {/* Header with menu button */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
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
              onClick={() => setHistoryOpen(true)}
              className="shrink-0"
            >
              <MoreVertical className="size-4" />
            </Button>
          </div>

          {/* Chat Panel - Full width */}
          <ChatPanel activeSessionId={activeSessionId} />
        </div>
      </SheetContent>

      {/* Chat History Sidebar - Opens as overlay */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent
          side="left"
          className="w-60 gap-0 p-3"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent Chats</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHistoryOpen(false)}
              className="size-6"
            >
              <X className="size-4" />
            </Button>
          </div>
          <ChatSidebar campaignId={campaignId} />
        </SheetContent>
      </Sheet>
    </Sheet>
  );
}
