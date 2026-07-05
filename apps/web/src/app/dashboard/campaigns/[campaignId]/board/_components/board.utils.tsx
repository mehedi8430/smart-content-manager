import { PostStatus } from "@/types/post.type";

export const getColumnConfig = (
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

export const getDueDateStatus = (
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

export const getStatusColor = (status: PostStatus): string => {
  switch (status) {
    case "todo":
      return "bg-muted text-muted-foreground";
    case "in_progress":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case "done":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
  }
};

export const getDueDateColor = (status: string): string => {
  switch (status) {
    case "overdue":
      return "bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive";
    case "upcoming":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const getStatusLabel = (status: string): string => {
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
