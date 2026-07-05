"use client";

import { deletePostAction } from "@/actions/post.action";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useBoard } from "@/providers/board-provider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DeletePostDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  postTitle: string;
}

export function DeletePostDialog({
  isOpen,
  onOpenChange,
  postTitle,
}: DeletePostDialogProps) {
  const router = useRouter();
  const { postToDelete, setDeleteDialogOpen, setPostToDelete, campaignId } =
    useBoard();

  const deletePost = async () => {
    try {
      const result = await deletePostAction(campaignId, postToDelete?.id || "");

      if (result.success) {
        toast.success(result.message || "Post deleted successfully");
        router.refresh();
        return;
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error("Failed to delete post");
    }
  };

  const confirmDelete = () => {
    if (postToDelete) {
      deletePost();
      setDeleteDialogOpen(false);
      setPostToDelete(undefined);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Post?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <strong>&quot;{postTitle}&quot;</strong>? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 justify-end">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDelete}
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
          >
            Delete
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
