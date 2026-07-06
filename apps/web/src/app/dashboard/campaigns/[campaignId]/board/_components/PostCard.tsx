"use client";

import { Post } from "@/types/post.type";
import { PostCardContent } from "./PostCardContent";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return <PostCardContent post={post} />;
}

