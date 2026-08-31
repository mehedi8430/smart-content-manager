/**
 * Campaign types for API requests and responses
 */

// Payload types
export interface CreateCampaignPayload {
  name: string;
  description?: string;
}

export interface UpdateCampaignPayload {
  name?: string;
  description?: string;
}

export interface ListCampaignsQuery {
  page?: number;
  limit?: number | 'all';
  search?: string;
  sortBy?: 'createdAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

// Response types
export interface CampaignCount {
  posts: number;
  outputs: number;
}

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  _count: CampaignCount;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CampaignListResponse {
  success: boolean;
  message: string;
  data: {
    data: Campaign[];
    pagination: PaginationMeta;
  };
}

export interface CampaignResponse {
  success: boolean;
  message: string;
  data: Campaign;
}

export interface CreateCampaignResponse {
  success: boolean;
  message: string;
  data: Campaign;
}

export interface UpdateCampaignResponse {
  success: boolean;
  message: string;
  data: Campaign;
}

export interface DeleteCampaignResponse {
  success: boolean;
  message: string;
}
