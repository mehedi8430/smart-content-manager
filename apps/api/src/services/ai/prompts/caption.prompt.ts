import { GenerateContentInput } from '../../../types/ai.types';

const LENGTH_GUIDANCE = {
    short: '~50 words',
    medium: '~150 words',
    long: '~300 words',
};

export function buildCaptionPrompt(
    input: GenerateContentInput,
    campaignContext: { name: string; description: string | null }
): { system: string; user: string } {
    const { prompt, tone, keywords, length } = input;
    const { name, description } = campaignContext;

    const lengthGuidance = length ? LENGTH_GUIDANCE[length] : LENGTH_GUIDANCE.medium;

    const system = `You are an expert social media copywriter. Write engaging captions that resonate with the target audience and encourage interaction.

Your captions must:
- Match the requested tone exactly
- Respect the length guidance provided
- Be conversational and authentic
- Include a separate section for hashtag suggestions at the end
- Consider the platform's best practices (Instagram, Twitter, LinkedIn, etc.)`;

    let user = `Campaign: ${name}`;
    if (description) {
        user += `\nCampaign Description: ${description}`;
    }

    user += `\n\nBrief/Topic: ${prompt}`;

    if (tone) {
        user += `\nTone: ${tone}`;
    }

    if (keywords && keywords.length > 0) {
        user += `\nKeywords to include: ${keywords.join(', ')}`;
    }

    user += `\nLength guidance: ${lengthGuidance}`;

    user += `\n\nWrite the caption below, followed by hashtag suggestions:`;

    return { system, user };
}
