import { ContentType } from '../../../types/ai.types';
import { buildAdPrompt } from './ad.prompt';
import { buildCaptionPrompt } from './caption.prompt';
import { buildEmailPrompt } from './email.prompt';

export type PromptBuilder = typeof buildAdPrompt;

export const PROMPT_BUILDERS: Record<ContentType, PromptBuilder> = {
    ad: buildAdPrompt,
    caption: buildCaptionPrompt,
    email: buildEmailPrompt,
};

export function getPromptBuilder(type: ContentType): PromptBuilder {
    const builder = PROMPT_BUILDERS[type];
    if (!builder) {
        throw new Error(`Invalid content type: ${type}`);
    }
    return builder;
}
