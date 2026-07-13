"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Post, PostStatus } from "@/types/post.type";

interface BoardContextType {
  campaignId: string;
  // UI State
  editingPost: Post | undefined;
  isSheetOpen: boolean;
  defaultStatusForNew: PostStatus;
  deleteDialogOpen: boolean;
  postToDelete: Post | undefined;
  initialDescription: string | undefined;
  setPostToDelete: (post: Post | undefined) => void;
  // Handlers
  handleAddPost: (status: PostStatus) => void;
  handleEditPost: (post: Post) => void;
  handleDeletePost: (post: Post) => void;
  handleAddPostWithDescription: (
    status: PostStatus,
    description: string,
  ) => void;
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
  // UI State
  const [editingPost, setEditingPost] = useState<Post | undefined>(undefined);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [defaultStatusForNew, setDefaultStatusForNew] =
    useState<PostStatus>("todo");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | undefined>(undefined);
  const [initialDescription, setInitialDescription] = useState<
    string | undefined
  >(undefined);

  // Handlers
  const handleAddPost = (status: PostStatus) => {
    setEditingPost(undefined);
    setDefaultStatusForNew(status);
    setInitialDescription(undefined);
    setIsSheetOpen(true);
  };

  const handleAddPostWithDescription = (
    status: PostStatus,
    description: string,
  ) => {
    setEditingPost(undefined);
    setDefaultStatusForNew(status);
    setInitialDescription(description);
    setIsSheetOpen(true);
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setInitialDescription(undefined);
    setIsSheetOpen(true);
  };

  const handleDeletePost = (post: Post) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  };

  return (
    <BoardContext.Provider
      value={{
        campaignId,
        editingPost,
        isSheetOpen,
        defaultStatusForNew,
        deleteDialogOpen,
        postToDelete,
        initialDescription,
        setPostToDelete,
        handleAddPost,
        handleEditPost,
        handleDeletePost,
        handleAddPostWithDescription,
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
