/**
 * Post types for API requests and responses
 */

export type PostStatus = 'todo' | 'in_progress' | 'done';

export interface Post {
  id: string;
  title: string;
  description: string | null;
  status: PostStatus;
  order: number;
  dueDate: string | null;
  campaignId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostInput {
  title: string;
  description?: string;
  dueDate?: string;
  order?: number;
  status?: PostStatus;
}

export type UpdatePostInput = Partial<CreatePostInput>;

export interface BulkUpdateItem {
  id: string;
  status?: PostStatus;
  order?: number;
}

export interface ListPostsQuery {
  status?: PostStatus;
  search?: string;
}

export interface PostListResponse {
  success: boolean;
  message: string;
  data: Post[];
}

export interface PostResponse {
  success: boolean;
  message: string;
  data: Post;
}

export interface CreatePostResponse {
  success: boolean;
  message: string;
  data: Post;
}

export interface UpdatePostResponse {
  success: boolean;
  message: string;
  data: Post;
}

export interface DeletePostResponse {
  success: boolean;
  message: string;
}

export interface UpdatePostStatusResponse {
  success: boolean;
  message: string;
  data: Post;
}

export interface BulkUpdatePostsResponse {
  success: boolean;
  message: string;
  data: Post[];
}
