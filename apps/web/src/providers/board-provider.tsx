"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Post, PostStatus } from "@/types/post.type";

interface BoardContextType {
  campaignId: string;
  deletePost: (id: string) => void;
  movePost: (id: string, newStatus: PostStatus) => void;
  // UI State
  editingPost: Post | undefined;
  isSheetOpen: boolean;
  defaultStatusForNew: PostStatus;
  deleteDialogOpen: boolean;
  postToDelete: Post | undefined;
  // Handlers
  handleAddPost: (status: PostStatus) => void;
  handleEditPost: (post: Post) => void;
  handleDeletePost: (post: Post) => void;
  confirmDelete: () => void;
  handleMovePost: (id: string, newStatus: PostStatus) => void;
  setIsSheetOpen: (open: boolean) => void;
  setDeleteDialogOpen: (open: boolean) => void;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export function BoardProvider({
  children,
  campaignId,
}: {
  children: ReactNode;
  campaignId: string;
}) {
  const deletePost = (id: string) => {
    console.log(id);
  };

  const movePost = (id: string, newStatus: PostStatus) => {
    console.log(id, newStatus);
  };

  // UI State
  const [editingPost, setEditingPost] = useState<Post | undefined>(undefined);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [defaultStatusForNew, setDefaultStatusForNew] =
    useState<PostStatus>("todo");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | undefined>(undefined);

  // Handlers
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
    <BoardContext.Provider
      value={{
        campaignId,
        deletePost,
        movePost,
        editingPost,
        isSheetOpen,
        defaultStatusForNew,
        deleteDialogOpen,
        postToDelete,
        handleAddPost,
        handleEditPost,
        handleDeletePost,
        confirmDelete,
        handleMovePost,
        setIsSheetOpen,
        setDeleteDialogOpen,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
}

export function useBoard() {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error("useBoard must be used within BoardProvider");
  }
  return context;
}
