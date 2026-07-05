"use client";

import { useState } from "react";
import { PostStatus, useBoard } from "../_context/BoardContext";
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
  const { deletePost, movePost } = useBoard();
  const [filterStatus, setFilterStatus] = useState<
    "all" | "todo" | "in_progress" | "done"
  >("all");
  const [editingPost, setEditingPost] = useState<Post | undefined>(undefined);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [defaultStatusForNew, setDefaultStatusForNew] =
    useState<PostStatus>("todo");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | undefined>(undefined);

  const handleAddPost = (status: PostStatus) => {
    setEditingPost(undefined);
    setDefaultStatusForNew(status);
    setIsSheetOpen(true);
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setIsSheetOpen(true);
  };

  const handleDeletePost = (post: Post) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (postToDelete) {
      deletePost(postToDelete.id);
      setDeleteDialogOpen(false);
      setPostToDelete(undefined);
    }
  };

  const handleMovePost = (id: string, newStatus: PostStatus) => {
    movePost(id, newStatus);
  };

  return (
    <div className="space-y-8">
      <BoardHeader
        campaignName={campaignName}
        onNewPost={() => handleAddPost("todo")}
        onFilterChange={setFilterStatus}
        currentFilter={filterStatus}
      />

      {/* Kanban Columns */}
      <ScrollArea className="w-full">
        <div className="flex gap-4 py-4 w-full">
          <KanbanColumn
            status="todo"
            onAddClick={() => handleAddPost("todo")}
            onEditClick={handleEditPost}
            onDeleteClick={handleDeletePost}
            onMoveClick={handleMovePost}
            posts={posts}
          />
          <KanbanColumn
            status="in_progress"
            onAddClick={() => handleAddPost("in_progress")}
            onEditClick={handleEditPost}
            onDeleteClick={handleDeletePost}
            onMoveClick={handleMovePost}
            posts={posts}
          />
          <KanbanColumn
            status="done"
            onAddClick={() => handleAddPost("done")}
            onEditClick={handleEditPost}
            onDeleteClick={handleDeletePost}
            onMoveClick={handleMovePost}
            posts={posts}
          />
        </div>
      </ScrollArea>

      {/* Post Sheet */}
      <PostSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        post={editingPost}
        defaultStatus={defaultStatusForNew}
      />

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
