export type ContentType = 'ad' | 'caption' | 'email';

export interface GenerateContentInput {
    type: ContentType;
    prompt: string;
    tone?: string;
    keywords?: string[];
    length?: 'short' | 'medium' | 'long';
}

export interface GenerationResult {
    content: string;
    tokensUsed: number;
    model: string;
}

export class AiGenerationError extends Error {
    statusCode?: number;
    model?: string;

    constructor(message: string, options?: { statusCode?: number; model?: string }) {
        super(message);
        this.name = 'AiGenerationError';
        this.statusCode = options?.statusCode;
        this.model = options?.model;
    }
}
