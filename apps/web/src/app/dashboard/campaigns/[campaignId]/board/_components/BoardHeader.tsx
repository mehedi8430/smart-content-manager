"use client";

import { Button } from "@/components/ui/button";
import { Plus, Sparkles, MessageSquare } from "lucide-react";
import { useBoard } from "../../../../../../providers/board-provider";
import Link from "next/link";
import { useOpenChat } from "@/hooks/use-open-chat";

interface BoardHeaderProps {
  campaignName: string;
  totalPosts: number;
  campaignId: string;
}

export function BoardHeader({
  campaignName,
  totalPosts,
  campaignId,
}: BoardHeaderProps) {
  const { handleAddPost } = useBoard();
  const { openCampaignChat } = useOpenChat();

  return (
    <div className="space-y-6">
      {/* Title & Total Count */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{campaignName}</h1>
          <p className="text-muted-foreground">
            Manage your campaign content and tasks
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* open add post sheet */}
          <Button
            variant="outline"
            className="border-sidebar-primary/50! text-sidebar-primary hover:text-sidebar-primary/80 cursor-pointer"
            onClick={() => handleAddPost("todo")}
          >
            <Plus className="h-4 w-4" />
            New Post
          </Button>
          <Link href={`/dashboard/campaigns/${campaignId}/generate`}>
            <Button
              variant="outline"
              className="border-sidebar-primary/50! text-sidebar-primary hover:text-sidebar-primary/80 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate AI Content
            </Button>
          </Link>
          <Button
            variant="outline"
            className="border-sidebar-primary/50! text-sidebar-primary hover:text-sidebar-primary/80 cursor-pointer"
            onClick={() => openCampaignChat(campaignId)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Ask the copilot
          </Button>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted">
            <span className="text-sm font-semibold">{totalPosts}</span>
            <span className="text-xs text-muted-foreground">
              {totalPosts === 1 ? "post" : "posts"}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      {/* <BoardSearchFilter /> */}
    </div>
  );
}
