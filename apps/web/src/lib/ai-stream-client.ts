import { AiOutput } from "@/types/ai-output.type";

export interface GenerateContentInput {
    type: "ad" | "caption" | "email";
    prompt: string;
    tone?: string;
    keywords?: string[];
    length?: "short" | "medium" | "long";
}

/**
 * Streams AI content generation from the API using Server-Sent Events (SSE).
 *
 * @param campaignId - The ID of the campaign to generate content for
 * @param payload - The generation input parameters
 * @param handlers - Callback functions for handling streaming events
 * @param handlers.onChunk - Called when a chunk of content is received
 * @param handlers.onDone - Called when generation completes successfully with the final output
 * @param handlers.onError - Called when an error occurs during generation
 * @param signal - Optional AbortSignal to cancel the request
 * @returns Promise that resolves when streaming completes or is aborted
 *
 * @example
 * ```ts
 * await streamGeneration(
 *   'campaign-123',
 *   { type: 'ad', prompt: 'Create a summer sale ad' },
 *   {
 *     onChunk: (text) => console.log('Chunk:', text),
 *     onDone: (output) => console.log('Complete:', output),
 *     onError: (error) => console.error('Error:', error),
 *   },
 *   abortController.signal
 * );
 * ```
 */
export async function streamGeneration(
    campaignId: string,
    payload: GenerateContentInput,
    handlers: {
        onChunk: (text: string) => void;
        onDone: (output: AiOutput) => void;
        onError: (message: string) => void;
    },
    signal?: AbortSignal
): Promise<void> {
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/campaigns/${campaignId}/ai-outputs/generate`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
                signal,
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to start generation");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            throw new Error("Response body is not readable");
        }

        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // Split on '\n\n' to parse individual SSE frames
            const frames = buffer.split("\n\n");
            buffer = frames.pop() || ""; // Keep the last incomplete frame in buffer

            for (const frame of frames) {
                if (!frame.trim()) continue;

                // Parse SSE format: "data: {...}"
                const match = frame.match(/^data:\s*(.+)$/);
                if (!match) continue;

                try {
                    const data = JSON.parse(match[1]);

                    switch (data.type) {
                        case "chunk":
                            handlers.onChunk(data.content || "");
                            break;
                        case "done":
                            handlers.onDone(data.output);
                            return;
                        case "error":
                            handlers.onError(data.message || "Generation failed");
                            return;
                    }
                } catch (e) {
                    console.error("Failed to parse SSE frame:", e);
                }
            }
        }
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            // Silently return on abort (intentional cancel)
            return;
        }
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
        handlers.onError(errorMessage);
    }
}
