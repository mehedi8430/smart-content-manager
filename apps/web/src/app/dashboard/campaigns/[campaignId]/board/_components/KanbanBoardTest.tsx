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
  DragStartEvent,
  TouchSensor,
  KeyboardSensor,
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
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

interface KanbanBoardProps {
  campaignName: string;
  posts: Post[];
}

export function KanbanBoardTest({
  campaignName,
  posts: initialPosts,
}: KanbanBoardProps) {
  const { handleAddPost, campaignId } = useBoard();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Get the dragging post for the overlay
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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    //Handle item replacing itself
    if (active.id === over?.id) {
      return;
    }

    setPosts((posts) => {
      // Postion of the item being dragged
      const itemOriginalPos = posts.findIndex((item) => item.id === active.id);
      const itemNewPos = posts.findIndex((item) => item.id === over?.id);
      //Postion of the item being replace
      //Swap the and generate a new list
      return arrayMove(posts, itemOriginalPos, itemNewPos);
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners} // Calculate if hovering over a droppable
      onDragStart={handleDragStart}
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
