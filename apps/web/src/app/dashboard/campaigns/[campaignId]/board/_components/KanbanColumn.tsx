import { PostCard } from "./PostCard";
import { Button } from "@/components/ui/button";
import { Plus, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Post, PostStatus } from "@/types/post.type";

interface KanbanColumnProps {
  status: PostStatus;
  onAddClick: () => void;
  onEditClick: (post: Post) => void;
  onDeleteClick: (post: Post) => void;
  onMoveClick: (id: string, status: PostStatus) => void;
  posts: Post[];
}

const getColumnConfig = (
  status: PostStatus,
): { label: string; color: string; accent: string } => {
  switch (status) {
    case "todo":
      return {
        label: "To Do",
        color: "bg-muted/50",
        accent: "border-l-slate-400 dark:border-l-slate-600",
      };
    case "in_progress":
      return {
        label: "In Progress",
        color: "bg-blue-50/50 dark:bg-blue-950/20",
        accent: "border-l-blue-400 dark:border-l-blue-600",
      };
    case "done":
      return {
        label: "Done",
        color: "bg-green-50/50 dark:bg-green-950/20",
        accent: "border-l-green-400 dark:border-l-green-600",
      };
  }
};

export function KanbanColumn({
  status,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onMoveClick,
  posts,
}: KanbanColumnProps) {
  const config = getColumnConfig(status);

  return (
    <div className={cn("rounded-lg flex flex-col min-w-87.5 max-w-100")}>
      {/* Column Header */}
      <div
        className={cn(
          "p-4 rounded-t-lg border-l-4",
          config.accent,
          "bg-border/40 border-b border-border",
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">{config.label}</h2>
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-semibold">
              {posts?.length || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Column Content */}
      <div
        className={cn(
          "flex-1 p-3 space-y-2 rounded-b-lg overflow-y-auto min-h-125",
          config.color,
        )}
      >
        {posts?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
            <Inbox className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground font-medium">
              No posts yet
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Click &quot;+ Add post&quot; to get started
            </p>
          </div>
        ) : (
          <>
            {posts?.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onEdit={onEditClick}
                onDelete={(id) =>
                  onDeleteClick(posts.find((p) => p.id === id)!)
                }
                onMove={onMoveClick}
              />
            ))}
          </>
        )}

        {/* Add Post Button */}
        <Button
          onClick={onAddClick}
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground mt-3 h-auto py-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add post
        </Button>
      </div>
    </div>
  );
}
