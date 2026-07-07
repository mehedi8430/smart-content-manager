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
import { useState } from "react";
import { toast } from "sonner";

export function DeletePostDialog() {
  const router = useRouter();
  const {
    postToDelete,
    deleteDialogOpen,
    setDeleteDialogOpen,
    setPostToDelete,
    campaignId,
  } = useBoard();

  const [isDeleting, setIsDeleting] = useState(false);

  const deletePost = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    try {
      setIsDeleting(true);
      const result = await deletePostAction(campaignId, postToDelete?.id || "");

      if (result.success) {
        toast.success(result.message || "Post deleted successfully");
        setDeleteDialogOpen(false);
        setPostToDelete(undefined);
        router.refresh();
        return;
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Post?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <strong>&quot;{postToDelete?.title || ""}&quot;</strong>? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 justify-end">
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={deletePost}
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
