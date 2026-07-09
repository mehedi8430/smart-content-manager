import { GenerateContentInput, GenerationResult } from '../../types/ai.types';

const FAKE_RESPONSES: Record<string, string> = {
    ad: "Unlock more free time with SmartPlan — the scheduling app that thinks ahead so you don't have to. Try it free today.",
    caption: "New week, new wins. 💪 What's one goal you're chasing this week? #MondayMotivation #GrowthMindset",
    email: "Subject: Your weekly digest is here\n\nHi there,\n\nHere's what happened this week in your workspace...",
};

export async function* mockStreamGenerateContent(
    input: GenerateContentInput
): AsyncGenerator<string, GenerationResult> {
    const full = FAKE_RESPONSES[input.type] || 'This is a mock generated response for testing.';
    const words = full.split(' ');

    for (const word of words) {
        await new Promise((r) => setTimeout(r, 60)); // simulate token latency
        yield word + ' ';
    }

    return {
        content: full,
        tokensUsed: words.length,
        model: 'mock-model',
    };
}