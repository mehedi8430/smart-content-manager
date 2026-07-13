export interface AiOutput {
  id: string;
  type: string;
  title?: string;
  prompt: string;
  tone?: string;
  content: string;
  status: string;
  model?: string;
  tokensUsed?: number;
  campaignId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListAiOutputsResponse {
  success: boolean;
  message: string;
  data: AiOutput[];
}

export interface GetAiOutputResponse {
  success: boolean;
  message: string;
  data: AiOutput;
}

export interface DeleteAiOutputResponse {
  success: boolean;
  message: string;
}
