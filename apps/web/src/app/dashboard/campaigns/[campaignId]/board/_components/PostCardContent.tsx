"use client";

import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GripVertical,
  MoreVertical,
  Calendar,
  Edit2,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Post, PostStatus } from "@/types/post.type";
import { useBoard } from "../../../../../../providers/board-provider";
import {
  getDueDateColor,
  getDueDateStatus,
  getStatusColor,
  getStatusLabel,
} from "./board.utils";
import { useRouter } from "next/navigation";
import { updatePostStatusAction } from "@/actions/post.action";
import { toast } from "sonner";
import { HTMLAttributes } from "react";

interface PostCardContentProps {
  post: Post;
  dragAttributes?: HTMLAttributes<HTMLDivElement>;
  dragListeners?: HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
}

export function PostCardContent({
  post,
  dragAttributes, // Pointer events for the grip icon
  dragListeners, // Same events
  isDragging,
}: PostCardContentProps) {
  const router = useRouter();
  const { handleEditPost, handleDeletePost, campaignId } = useBoard();

  const dueDateStatus = getDueDateStatus(post.dueDate);
  const formattedDate = post.dueDate
    ? format(new Date(post.dueDate), "MMM d")
    : null;

  const handleMovePost = async (id: string, newStatus: PostStatus) => {
    try {
      const result = await updatePostStatusAction(campaignId, id, newStatus);

      if (result.success) {
        toast.success(result.message || "Post moved successfully");
        router.refresh();
        return;
      }
    } catch (error) {
      console.error("Failed to move post:", error);
      toast.error("Failed to move post");
    }
  };

  return (
    <Card
      onClick={() => handleEditPost(post)}
      className={cn(
        "group mb-3 overflow-hidden cursor-pointer border-l-4 border-l-muted transition-all p-3",
        isDragging
          ? "shadow-2xl opacity-50 bg-primary/10"
          : "hover:shadow-md",
      )}
    >
      <div className="flex gap-2">
        <div
          {...dragAttributes} // Attach listeners to grip icon
          {...dragListeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-sm font-semibold line-clamp-2 flex-1">
              {post.title}
            </h3>
            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {/* Edit Post */}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditPost(post);
                  }}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>

                {/* Move Post */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Move to
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {post.status !== "todo" && (
                      <DropdownMenuItem
                        onClick={async (e) => {
                          e.stopPropagation();
                          await handleMovePost(post.id, "todo");
                        }}
                      >
                        To Do
                      </DropdownMenuItem>
                    )}
                    {post.status !== "in_progress" && (
                      <DropdownMenuItem
                        onClick={async (e) => {
                          e.stopPropagation();
                          await handleMovePost(post.id, "in_progress");
                        }}
                      >
                        In Progress
                      </DropdownMenuItem>
                    )}
                    {post.status !== "done" && (
                      <DropdownMenuItem
                        onClick={async (e) => {
                          e.stopPropagation();
                          await handleMovePost(post.id, "done");
                        }}
                      >
                        Done
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                {/* Delete Post */}
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePost(post);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Description */}
          {post.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {post.description}
            </p>
          )}

          {/* Status Badge and Due Date */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-xs px-2 py-1 rounded-full font-medium", getStatusColor(post.status))}>
              {getStatusLabel(post.status)}
            </span>
            {formattedDate && (
              <div className={cn("text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium", getDueDateColor(dueDateStatus))}>
                <Calendar className="w-3 h-3" />
                {formattedDate}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
