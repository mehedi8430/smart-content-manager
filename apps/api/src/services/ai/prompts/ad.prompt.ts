import { GenerateContentInput } from '../../../types/ai.types';

const LENGTH_GUIDANCE = {
    short: '~50 words',
    medium: '~150 words',
    long: '~300 words',
};

export function buildAdPrompt(
    input: GenerateContentInput,
    campaignContext: { name: string; description: string | null }
): { system: string; user: string } {
    const { prompt, tone, keywords, length } = input;
    const { name, description } = campaignContext;

    const lengthGuidance = length ? LENGTH_GUIDANCE[length] : LENGTH_GUIDANCE.medium;

    const system = `You are an expert copywriter specializing in conversion-focused advertising copy. Write concise, compelling ad copy that drives action.

Your ads must:
- Have a clear, compelling call-to-action (CTA)
- Match the requested tone exactly
- Respect the length guidance provided
- Focus on benefits over features
- Be attention-grabbing from the first word`;

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

    user += `\n\nWrite the ad copy below:`;

    return { system, user };
}
