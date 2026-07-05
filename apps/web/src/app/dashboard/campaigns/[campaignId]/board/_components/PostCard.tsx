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
import { Post } from "@/types/post.type";
import { useBoard } from "../../../../../../providers/board-provider";

interface PostCardProps {
  post: Post;
}

const getDueDateStatus = (
  dueDate: string | null | undefined,
): "upcoming" | "overdue" | "done" | "none" => {
  if (!dueDate) return "none";

  const due = new Date(dueDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  if (dueDay < today) return "overdue";
  if (
    dueDay.getTime() === today.getTime() ||
    (dueDay > today &&
      dueDay.getTime() - today.getTime() <= 7 * 24 * 60 * 60 * 1000)
  ) {
    return "upcoming";
  }
  return "none";
};

export function PostCard({ post }: PostCardProps) {
  const { handleEditPost, handleDeletePost, handleMovePost } = useBoard();

  const dueDateStatus = getDueDateStatus(post.dueDate);
  const formattedDate = post.dueDate
    ? format(new Date(post.dueDate), "MMM d")
    : null;

  const getStatusColor = (status: "todo" | "in_progress" | "done"): string => {
    switch (status) {
      case "todo":
        return "bg-muted text-muted-foreground";
      case "in_progress":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "done":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    }
  };

  const getDueDateColor = (status: string): string => {
    switch (status) {
      case "overdue":
        return "bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive";
      case "upcoming":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "todo":
        return "To Do";
      case "in_progress":
        return "In Progress";
      case "done":
        return "Done";
      default:
        return status;
    }
  };

  return (
    <Card className="group mb-3 cursor-grab active:cursor-grabbing overflow-hidden border-l-4 border-l-muted hover:shadow-md transition-shadow p-3">
      <div className="flex gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-sm font-semibold line-clamp-2 flex-1">
              {post.title}
            </h3>
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
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditPost(post);
                  }}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Move to
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {post.status !== "todo" && (
                      <DropdownMenuItem
                        onClick={() => handleMovePost(post.id, "todo")}
                      >
                        To Do
                      </DropdownMenuItem>
                    )}
                    {post.status !== "in_progress" && (
                      <DropdownMenuItem
                        onClick={() => handleMovePost(post.id, "in_progress")}
                      >
                        In Progress
                      </DropdownMenuItem>
                    )}
                    {post.status !== "done" && (
                      <DropdownMenuItem
                        onClick={() => handleMovePost(post.id, "done")}
                      >
                        Done
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

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

          {post.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {post.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {formattedDate && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                  getDueDateColor(dueDateStatus),
                )}
              >
                <Calendar className="w-3 h-3" />
                {formattedDate}
              </span>
            )}
            <span
              className={cn(
                "inline-flex px-2 py-1 rounded text-xs font-medium",
                getStatusColor(post.status),
              )}
            >
              {getStatusLabel(post.status)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
