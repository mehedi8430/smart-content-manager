"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useChat } from "@/providers/chat-provider";
import { useCreateChatSession } from "@/hooks/server-state/use-chat-sessions";

interface NewChatButtonProps {
  campaignId?: string;
  campaignName?: string;
}

export function NewChatButton({ campaignId }: NewChatButtonProps) {
  const { setActiveSessionId } = useChat();
  const createSession = useCreateChatSession();

  const handleNewChat = async () => {
    try {
      const session = await createSession.mutateAsync(campaignId);
      setActiveSessionId(session.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start a new chat",
      );
    }
  };

  return (
    <Button
      onClick={handleNewChat}
      disabled={createSession.isPending}
      className="w-full justify-start gap-2"
      variant="outline"
    >
      <Plus className="size-4" />
      {createSession.isPending ? "Starting…" : "New chat"}
    </Button>
  );
}
