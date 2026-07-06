"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Post } from "@/types/post.type";
import { PostCardContent } from "./PostCardContent";
import { cn } from "@/lib/utils";

interface DraggablePostCardProps {
  post: Post;
}

export function DraggablePostCard({ post }: DraggablePostCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: post.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        isDragging && "z-50",
        isOver && "ring-2 ring-primary"
      )}
    >
      <PostCardContent 
        post={post}
        dragAttributes={attributes}
        dragListeners={listeners}
        isDragging={isDragging}
      />
    </div>
  );
}
