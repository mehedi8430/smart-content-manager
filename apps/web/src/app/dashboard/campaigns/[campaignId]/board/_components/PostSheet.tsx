"use client";

import React from "react";
import { useBoard } from "../../../../../../providers/board-provider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createPostAction, updatePostAction } from "@/actions/post.action";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const postFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]),
});

type PostFormValues = z.infer<typeof postFormSchema>;

export function PostSheet() {
  const {
    editingPost: post,
    isSheetOpen: isOpen,
    setIsSheetOpen: onOpenChange,
    defaultStatusForNew: defaultStatus,
    campaignId,
    initialDescription,
  } = useBoard();
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: post?.title || "",
      description: post?.description || initialDescription || "",
      dueDate: post?.dueDate ? post.dueDate.split("T")[0] : "",
      status: post?.status || defaultStatus,
    },
  });

  const onSubmit = async (values: PostFormValues) => {
    try {
      if (post) {
        // Update existing post
        const result = await updatePostAction(campaignId, post.id, {
          title: values.title,
          description: values.description || undefined,
          dueDate: values.dueDate
            ? `${values.dueDate}T00:00:00.000Z`
            : undefined,
          status: values.status,
        });

        if (result.success) {
          toast.success(result.message || "Post updated successfully");
          router.refresh();
          onOpenChange(false);
          return;
        }
      } else {
        // Create new post
        const result = await createPostAction(campaignId, {
          title: values.title,
          description: values.description || undefined,
          dueDate: values.dueDate
            ? `${values.dueDate}T00:00:00.000Z`
            : undefined,
          status: values.status,
        });

        if (result.success) {
          toast.success(result.message || "Post created successfully");
          router.refresh();
          onOpenChange(false);
          return;
        }
      }
    } catch (error) {
      console.error("Failed to save post:", error);
      toast.error("Failed to save post");
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      reset({
        title: post?.title || "",
        description: post?.description || initialDescription || "",
        dueDate: post?.dueDate ? post.dueDate.split("T")[0] : "",
        status: post?.status || defaultStatus,
      });
    }
  }, [isOpen, post, defaultStatus, initialDescription, reset]);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange} key={post?.id || "new"}>
      <SheetContent side="right" className="w-full sm:w-120 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{post ? "Edit Post" : "Create New Post"}</SheetTitle>
          <SheetDescription>
            Create a new post for this campaign
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4 px-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter post title"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm font-medium text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add optional description"
              style={{ height: "12rem" }}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm font-medium text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && (
                <p className="text-sm font-medium text-destructive">
                  {errors.status.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
              {errors.dueDate && (
                <p className="text-sm font-medium text-destructive">
                  {errors.dueDate.message}
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : post ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
