"use client";

import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { usePathname } from "next/navigation";
import { ChatPanel } from "./chat-panel";
import { useChat } from "@/providers/chat-provider";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { ChatDropdownMenu } from "./chat-dropdown-menu";

const CAMPAIGN_ID_RE =
  /^\/dashboard\/campaigns\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

export function ChatDrawer() {
  const pathname = usePathname();
  const campaignMatch = pathname.match(CAMPAIGN_ID_RE);
  const campaignId = campaignMatch?.[1];

  const { drawerOpen, setDrawerOpen, activeSessionId, setActiveSessionId } =
    useChat();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <div className="flex h-full flex-col">
          {/* Header with menu button */}
          <div className="relative flex items-center justify-between border-b border-border px-4 py-3 pr-12">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Campaign Copilot</p>
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

            <ChatDropdownMenu
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
              campaignId={campaignId}
              activeSessionId={activeSessionId}
              setActiveSessionId={setActiveSessionId}
            />
          </div>

          {/* Chat Panel - Full width */}
          <ChatPanel activeSessionId={activeSessionId} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
