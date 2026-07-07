"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useBoard } from "../../../../../../providers/board-provider";
import BoardSearchFilter from "./BoardSearchFilter";

interface BoardHeaderProps {
  campaignName: string;
  totalPosts: number;
}

export function BoardHeader({ campaignName, totalPosts }: BoardHeaderProps) {
  const { handleAddPost } = useBoard();

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
