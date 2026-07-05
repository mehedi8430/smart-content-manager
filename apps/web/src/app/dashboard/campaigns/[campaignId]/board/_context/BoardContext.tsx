"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface Post {
  id: string;
  title: string;
  description?: string | null;
  status: "todo" | "in_progress" | "done";
  order: number;
  dueDate?: string | null;
}

export type PostStatus = "todo" | "in_progress" | "done";

interface BoardContextType {
  posts: Post[];
  addPost: (post: Post) => void;
  updatePost: (id: string, post: Partial<Post>) => void;
  deletePost: (id: string) => void;
  movePost: (id: string, newStatus: PostStatus) => void;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export function BoardProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "1",
      title: "Write Facebook Ad Copy",
      description:
        "Draft 3 variations for the summer sale campaign targeting 25-34 age group.",
      status: "todo",
      order: 0,
      dueDate: "2026-08-10T00:00:00.000Z",
    },
    {
      id: "2",
      title: "Design Instagram Carousel",
      description: null,
      status: "todo",
      order: 1,
      dueDate: "2026-08-15T00:00:00.000Z",
    },
    {
      id: "3",
      title: "Schedule Email Newsletter",
      description:
        "Monthly digest for subscribers. Include product highlights and blog links.",
      status: "in_progress",
      order: 0,
      dueDate: "2026-07-30T00:00:00.000Z",
    },
    {
      id: "4",
      title: "Create TikTok Script",
      description: null,
      status: "in_progress",
      order: 1,
      dueDate: null,
    },
    {
      id: "5",
      title: "Publish Landing Page Copy",
      description: "Hero section, features, CTA, and FAQ.",
      status: "done",
      order: 0,
      dueDate: "2026-07-01T00:00:00.000Z",
    },
    {
      id: "6",
      title: "A/B Test Subject Lines",
      description: null,
      status: "done",
      order: 1,
      dueDate: "2026-07-05T00:00:00.000Z",
    },
  ]);

  const addPost = (post: Post) => {
    setPosts((prev) => [...prev, post]);
  };

  const updatePost = (id: string, updates: Partial<Post>) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === id ? { ...post, ...updates } : post))
    );
  };

  const deletePost = (id: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== id));
  };

  const movePost = (id: string, newStatus: PostStatus) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id ? { ...post, status: newStatus } : post
      )
    );
  };

  return (
    <BoardContext.Provider
      value={{
        posts,
        addPost,
        updatePost,
        deletePost,
        movePost,
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
