import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required but not set in environment variables');
}

export const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export const AI_MODEL = process.env.AI_MODEL || 'claude-sonnet-4-6';

export const AI_MAX_TOKENS = parseInt(process.env.AI_MAX_TOKENS || '1024', 10);
