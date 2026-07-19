"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createChatSession } from "@/api/chat.api";
import { useChat } from "@/providers/chat-provider";
import { useQueryClient } from "@tanstack/react-query";
import { chatKeys } from "@/types/queryKeys";
import { useState } from "react";

interface NewChatButtonProps {
  /**
   * When provided (e.g. rendered on a campaign detail page), the new session is
   * scoped to that campaign. When omitted (general dashboard route), a
   * campaignId-less session is created. Entry point is inferred from this prop
   * at render time — no ambiguous routing decisions are made inside.
   */
  campaignId?: string;
  campaignName?: string;
}

export function NewChatButton({ campaignId }: NewChatButtonProps) {
  const { setActiveSessionId } = useChat();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const handleNewChat = async () => {
    try {
      setIsCreating(true);
      const session = await createChatSession(campaignId);
      // New session bumps the sidebar list (updatedAt desc) — refresh it so the
      // fresh row appears immediately, then open it.
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
      setActiveSessionId(session.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start a new chat",
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button
      onClick={handleNewChat}
      disabled={isCreating}
      className="w-full justify-start gap-2"
      variant="outline"
    >
      <Plus className="size-4" />
      {isCreating ? "Starting…" : "New chat"}
    </Button>
  );
}
