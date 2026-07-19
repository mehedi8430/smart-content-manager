"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createChatSession, listChatSessions } from "@/api/chat.api";
import { chatKeys } from "@/types/queryKeys";
import { useChat } from "@/providers/chat-provider";
import type { ChatSessionSummary } from "@/types/chat.type";

/**
 * Opens the chat drawer and primes it with a session.
 *
 * - General (no campaignId): opens the drawer on the existing session list;
 *   if no session is active yet, the user starts one from the sidebar.
 * - Campaign-scoped (resume-or-create): if the user already has a
 *   campaign-scoped session it is resumed (most recent first), otherwise a new
 *   campaign-scoped session is created and selected.
 *
 * This hook is the single entry point used by both the campaign "Ask the
 * copilot" button and the general dashboard nav item, keeping open behavior in
 * one place rather than duplicating it across entry points.
 */
export function useOpenChat() {
  const { setActiveSessionId, setDrawerOpen } = useChat();
  const queryClient = useQueryClient();

  const openGeneral = useCallback(() => {
    setDrawerOpen(true);
  }, [setDrawerOpen]);

  const openCampaignChat = useCallback(
    async (campaignId: string) => {
      setDrawerOpen(true);

      try {
        // Ensure the campaign-scoped list is cached, then resume the most
        // recent session (server returns updatedAt desc) if one exists.
        const sessions = await queryClient.fetchQuery({
          queryKey: chatKeys.list(campaignId),
          queryFn: () => listChatSessions(campaignId),
        });

        const existing = sessions.find((s) => s.campaignId === campaignId);
        if (existing) {
          setActiveSessionId(existing.id);
          return;
        }

        const session = await createChatSession(campaignId);
        queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
        setActiveSessionId(session.id);
      } catch {
        // Drawer is already open; the sidebar will surface the error/empty state.
      }
    },
    [queryClient, setActiveSessionId, setDrawerOpen],
  );

  return { openGeneral, openCampaignChat };
}

export type { ChatSessionSummary };
