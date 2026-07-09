import { GenerateContentInput } from '../../../types/ai.types';

const LENGTH_GUIDANCE = {
    short: '~50 words',
    medium: '~150 words',
    long: '~300 words',
};

export function buildEmailPrompt(
    input: GenerateContentInput,
    campaignContext: { name: string; description: string | null }
): { system: string; user: string } {
    const { prompt, tone, keywords, length } = input;
    const { name, description } = campaignContext;

    const lengthGuidance = length ? LENGTH_GUIDANCE[length] : LENGTH_GUIDANCE.medium;

    const system = `You are an expert email marketing copywriter. Write compelling marketing emails that drive opens, clicks, and conversions.

Your emails must:
- Have a clear, attention-grabbing subject line
- Match the requested tone exactly
- Respect the length guidance provided for the body
- Have a clear call-to-action
- Be scannable with short paragraphs
- Follow email marketing best practices`;

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

    user += `\nLength guidance for body: ${lengthGuidance}`;

    user += `\n\nWrite the email below, with the subject line clearly separated from the body:`;

    return { system, user };
}
