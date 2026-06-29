"use client";

import React, { useState, useMemo } from "react";
import { Post, PostStatus, useBoard } from "../_context/BoardContext";
import { KanbanColumn } from "./KanbanColumn";
import { PostSheet } from "./PostSheet";
import { DeletePostDialog } from "./DeletePostDialog";
import { BoardHeader } from "./BoardHeader";
import { ScrollArea } from "@/components/ui/scroll-area";

interface KanbanBoardProps {
  campaignName: string;
}

export function KanbanBoard({ campaignName }: KanbanBoardProps) {
  const { posts, deletePost, movePost } = useBoard();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "todo" | "in_progress" | "done"
  >("all");
  const [editingPost, setEditingPost] = useState<Post | undefined>(undefined);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [defaultStatusForNew, setDefaultStatusForNew] =
    useState<PostStatus>("todo");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | undefined>(undefined);

  // Filter posts based on search and status
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch = post.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesFilter =
        filterStatus === "all" || post.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [posts, searchQuery, filterStatus]);

  // Group posts by status
  const postsByStatus = useMemo(() => {
    return {
      todo: filteredPosts.filter((p) => p.status === "todo"),
      in_progress: filteredPosts.filter((p) => p.status === "in_progress"),
      done: filteredPosts.filter((p) => p.status === "done"),
    };
  }, [filteredPosts]);

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
        onSearchChange={setSearchQuery}
        onFilterChange={setFilterStatus}
        currentFilter={filterStatus}
        searchQuery={searchQuery}
      />

      {/* Kanban Columns */}
      <ScrollArea className="w-full rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex gap-4 p-4 w-full">
          <KanbanColumn
            status="todo"
            posts={postsByStatus.todo}
            onAddClick={() => handleAddPost("todo")}
            onEditClick={handleEditPost}
            onDeleteClick={handleDeletePost}
            onMoveClick={handleMovePost}
          />
          <KanbanColumn
            status="in_progress"
            posts={postsByStatus.in_progress}
            onAddClick={() => handleAddPost("in_progress")}
            onEditClick={handleEditPost}
            onDeleteClick={handleDeletePost}
            onMoveClick={handleMovePost}
          />
          <KanbanColumn
            status="done"
            posts={postsByStatus.done}
            onAddClick={() => handleAddPost("done")}
            onEditClick={handleEditPost}
            onDeleteClick={handleDeletePost}
            onMoveClick={handleMovePost}
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
