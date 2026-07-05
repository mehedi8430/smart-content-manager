"use client";

import { useBoard } from "../../../../../../providers/board-provider";
import { KanbanColumn } from "./KanbanColumn";
import { PostSheet } from "./PostSheet";
import { DeletePostDialog } from "./DeletePostDialog";
import { BoardHeader } from "./BoardHeader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Post } from "@/types/post.type";

interface KanbanBoardProps {
  campaignName: string;
  posts: Post[];
}

export function KanbanBoard({ campaignName, posts }: KanbanBoardProps) {
  const {
    handleAddPost,
    confirmDelete,
    deleteDialogOpen,
    postToDelete,
    setDeleteDialogOpen,
  } = useBoard();

  return (
    <div className="space-y-8">
      <BoardHeader campaignName={campaignName} totalPosts={posts.length} />

      {/* Kanban Columns */}
      <ScrollArea className="w-full">
        <div className="flex gap-4 py-4 w-full">
          <KanbanColumn
            status="todo"
            onAddClick={() => handleAddPost("todo")}
            posts={posts}
          />
          <KanbanColumn
            status="in_progress"
            onAddClick={() => handleAddPost("in_progress")}
            posts={posts}
          />
          <KanbanColumn
            status="done"
            onAddClick={() => handleAddPost("done")}
            posts={posts}
          />
        </div>
      </ScrollArea>

      {/* Post Sheet */}
      <PostSheet />

      {/* Delete Dialog */}
      <DeletePostDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        postTitle={postToDelete?.title || ""}
      />
    </div>
  );
}
