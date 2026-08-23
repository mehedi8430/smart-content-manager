export interface TApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface TUser {
  email: string;
  id: string;
  passwordHash?: string;
  refreshToken?: string | null;
  createdAt?: Date;
}

// Campaign DTOs
export interface TCampaign {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TCampaignWithCounts extends TCampaign {
  _count: {
    posts: number;
    outputs: number;
  };
}

export interface TPaginatedCampaignsResponse {
  data: TCampaignWithCounts[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TCampaignCreateInput {
  name: string;
  description?: string;
}

export interface TCampaignUpdateInput {
  name?: string;
  description?: string;
}
