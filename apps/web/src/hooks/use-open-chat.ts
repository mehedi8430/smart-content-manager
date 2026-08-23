"use client";

import { useCallback, useState } from "react";
import { useChat } from "@/providers/chat-provider";
import type { ChatSessionSummary } from "@/types/chat.type";
import { useChatSessionsList, useCreateChatSession } from "./server-state/use-chat-sessions";

/**
 * Opens the chat drawer and initializes the appropriate session.
 * Resumes or creates a campaign session when needed, or opens the general chat.
 */
export function useOpenChat() {
  const { setActiveSessionId, setDrawerOpen } = useChat();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const createSession = useCreateChatSession();
  const { data: sessions } = useChatSessionsList(selectedCampaignId ?? undefined);

  const openGeneral = useCallback(() => {
    setDrawerOpen(true);
  }, [setDrawerOpen]);

  const openCampaignChat = useCallback(
    async (campaignId: string) => {
      setDrawerOpen(true);
      setSelectedCampaignId(campaignId);

      try {
        const existing = sessions?.find((s) => s.campaignId === campaignId);
        if (existing) {
          setActiveSessionId(existing.id);
          return;
        }

        const session = await createSession.mutateAsync(campaignId);
        setActiveSessionId(session.id);
      } catch {
        // Drawer is already open; the sidebar will surface the error/empty state.
      }
    },
    [setActiveSessionId, setDrawerOpen, createSession, sessions],
  );

  return { openGeneral, openCampaignChat };
}

export type { ChatSessionSummary };
