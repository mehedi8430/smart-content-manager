"use client";

import React, { useState } from "react";
import { Post, PostStatus, useBoard } from "../_context/BoardContext";
import {
  Sheet,
  SheetContent,
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

interface PostSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  post?: Post;
  defaultStatus?: PostStatus;
}

export function PostSheet({
  isOpen,
  onOpenChange,
  post,
  defaultStatus = "todo",
}: PostSheetProps) {
  const { addPost, updatePost } = useBoard();
  const [title, setTitle] = useState(post?.title || "");
  const [description, setDescription] = useState(post?.description || "");
  const [dueDate, setDueDate] = useState(
    post?.dueDate ? post.dueDate.split("T")[0] : "",
  );
  const [status, setStatus] = useState<PostStatus>(
    post?.status || defaultStatus,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (post) {
        // Update existing post
        updatePost(post.id, {
          title,
          description: description || null,
          dueDate: dueDate ? `${dueDate}T00:00:00.000Z` : null,
          status,
        });
      } else {
        // Create new post
        const newPost: Post = {
          id: Date.now().toString(),
          title,
          description: description || null,
          status,
          order: 0,
          dueDate: dueDate ? `${dueDate}T00:00:00.000Z` : null,
        };
        addPost(newPost);
      }

      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange} key={post?.id || "new"}>
      <SheetContent side="right" className="w-full sm:w-120 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{post ? "Edit Post" : "Create New Post"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter post title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              placeholder="Add optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-30 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as PostStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
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
            <Button type="submit" disabled={!title || isSubmitting}>
              {isSubmitting ? "Saving..." : post ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
