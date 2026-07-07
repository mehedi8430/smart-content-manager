"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Post } from "@/types/post.type";
import { cn } from "@/lib/utils";
import { PostCardContent } from "./PostCardContent";

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
  } = useSortable({ id: post.id }); // Makes this card draggable AND sortable within the column

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
        isOver && "ring-1 rounded-2xl ring-border", // Highlight if hovering over this card
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
