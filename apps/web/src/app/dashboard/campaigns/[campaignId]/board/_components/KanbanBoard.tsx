"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  TouchSensor,
  KeyboardSensor,
  DragOverEvent,
} from "@dnd-kit/core";
import { useBoard } from "../../../../../../providers/board-provider";
import { KanbanColumn } from "./KanbanColumn";
import { PostSheet } from "./PostSheet";
import { DeletePostDialog } from "./DeletePostDialog";
import { BoardHeader } from "./BoardHeader";
import { PostCardContent } from "./PostCardContent";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Post, PostStatus } from "@/types/post.type";
import { bulkUpdatePostsAction } from "@/actions/post.action";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

interface KanbanBoardProps {
  campaignName: string;
  posts: Post[];
  initialContent?: string;
}

export function KanbanBoard({
  campaignName,
  posts: initialPosts,
  initialContent,
}: KanbanBoardProps) {
  const { handleAddPost, handleAddPostWithDescription, campaignId } =
    useBoard();

  useEffect(() => {
    if (initialContent) {
      handleAddPostWithDescription("todo", initialContent);
    }
  }, [initialContent]);

  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  const activeDragPost = useMemo(
    () => posts.find((p) => p.id === activeId),
    [activeId, posts],
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveId(active.id as string);
  }

  // onDragOver does the column switching
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activePost = posts.find((p) => p.id === active.id);
    if (!activePost) return;

    // over.id is either a postId or a column status ("todo" | "in_progress" | "done")
    const overPost = posts.find((p) => p.id === over.id);
    const newStatus = overPost ? overPost.status : (over.id as PostStatus);

    if (activePost.status === newStatus) return;

    // Optimistically move the card to the new column
    setPosts((prev) =>
      prev.map((p) => (p.id === active.id ? { ...p, status: newStatus } : p)),
    );
  }

  // onDragEnd does the ordering and API sync.
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activePost = posts.find((p) => p.id === active.id);
    const overPost = posts.find((p) => p.id === over.id);
    const targetStatus = overPost ? overPost.status : (over.id as PostStatus);

    // Get final column posts after dragOver already mutated state
    const columnPosts = posts.filter((p) => p.status === targetStatus);

    const oldIndex = columnPosts.findIndex((p) => p.id === active.id);
    const newIndex = columnPosts.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(columnPosts, oldIndex, newIndex);

    // Optimistically reorder within same column if needed
    if (active.id !== over.id && activePost?.status === targetStatus) {
      setPosts((prev) => [
        ...prev.filter((p) => p.status !== targetStatus),
        ...reordered,
      ]);
    }

    // build bulk update from the reordered array
    const bulkItems = reordered.map((post, index) => ({
      id: post.id,
      status: post.status,
      order: index,
    }));

    // Sync to API — send entire board state
    bulkUpdatePostsAction(campaignId, bulkItems)
      .then((result) => {
        if (result.error) {
          console.error("Failed to update post order:", result.error);
          setPosts(posts);
        }
      })
      .catch(() => setPosts(posts));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-8">
        <BoardHeader
          campaignName={campaignName}
          totalPosts={posts.length}
          campaignId={campaignId}
        />

        {/* Kanban Columns */}
        <ScrollArea className="w-full">
          <div className="flex flex-col md:flex-row gap-4 py-4 w-full">
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
