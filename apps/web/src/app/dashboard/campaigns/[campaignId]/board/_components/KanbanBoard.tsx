"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useBoard } from "../../../../../../providers/board-provider";
import { KanbanColumn } from "./KanbanColumn";
import { PostSheet } from "./PostSheet";
import { DeletePostDialog } from "./DeletePostDialog";
import { BoardHeader } from "./BoardHeader";
import { PostCardContent } from "./PostCardContent";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Post, PostStatus } from "@/types/post.type";
import { updatePostStatusAction } from "@/actions/post.action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface KanbanBoardProps {
  campaignName: string;
  posts: Post[];
}

export function KanbanBoard({ campaignName, posts: initialPosts }: KanbanBoardProps) {
  const { handleAddPost, campaignId } = useBoard();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Get the dragging post for the overlay
  const activeDragPost = useMemo(
    () => posts.find((p) => p.id === activeId),
    [activeId, posts]
  );

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      distance: 8,
    } as Parameters<typeof useSensor>[1])
  );

  const handleDragStart = (event: DragEndEvent) => {
    const { active } = event;
    setActiveId(active.id as string); // "Which card am I dragging?"
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activePost = posts.find((p) => p.id === active.id);
    if (!activePost) return;

    // If dragging over a column (status), move the post to that column
    const validStatuses: PostStatus[] = ["todo", "in_progress", "done"];
    if (validStatuses.includes(over.id as PostStatus)) {
      const newStatus = over.id as PostStatus;
      if (activePost.status !== newStatus) {
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.id === activePost.id ? { ...p, status: newStatus } : p
          )
        );
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null); // Hide the overlay

    if (!over) return;

    const activePost = posts.find((p) => p.id === active.id);
    if (!activePost) return;

    const validStatuses: PostStatus[] = ["todo", "in_progress", "done"];
    const newStatus = validStatuses.includes(over.id as PostStatus)
      ? (over.id as PostStatus)
      : activePost.status;

    // If status changed, update on the server
    if (newStatus !== activePost.status) {
      try {
        const result = await updatePostStatusAction(campaignId, activePost.id, newStatus);
        if (!result.success) {
          toast.error(result.message || "Failed to move post");
          // Revert the local state
          setPosts(initialPosts);
        } else {
          toast.success(result.message || "Post moved successfully");
          router.refresh();
        }
      } catch (error) {
        console.error("Failed to move post:", error);
        toast.error("Failed to move post");
        // Revert the local state
        setPosts(initialPosts);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners} // Calculate if hovering over a droppable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-8">
        <BoardHeader campaignName={campaignName} totalPosts={posts.length} />

        {/* Kanban Columns */}
        <ScrollArea className="w-full">
          <div className="flex flex-col md:flex-row gap-4 py-4 w-full">
            <KanbanColumn
              status="todo"
              onAddClick={() => handleAddPost("todo")}
              // posts={initialPosts}
              posts={posts}
            />
            <KanbanColumn
              status="in_progress"
              onAddClick={() => handleAddPost("in_progress")}
              // posts={initialPosts}
              posts={posts}
            />
            <KanbanColumn
              status="done"
              onAddClick={() => handleAddPost("done")}
              // posts={initialPosts}
              posts={posts}
            />
          </div>
        </ScrollArea>

        {/* Post Sheet */}
        <PostSheet />

        {/* Delete Dialog */}
        <DeletePostDialog />
      </div>

      {/* Drag Overlay - Ghost card that follows the cursor */}
      <DragOverlay>
        {activeDragPost ? (
          <div className="drop-shadow-lg">
            <PostCardContent post={activeDragPost} isDragging={true} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}


