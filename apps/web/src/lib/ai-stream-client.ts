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
        const apiBaseUrl =
            typeof window === "undefined"
                ? process.env.NEXT_PUBLIC_API_BASE_URL
                : "/api/v1";
        const response = await fetch(
            `${apiBaseUrl}/campaigns/${campaignId}/ai-outputs/generate`,
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

        // Get the reader from the response body
        const reader = response.body?.getReader();
        // Convert bytes to text
        const textDecoder = new TextDecoder();

        if (!reader) {
            throw new Error("Response body is not readable");
        }

        let buffer = "";

        while (true) {
            // Instead of waiting for the entire response, read chunks(bytes) as they arrive
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            const chunk = textDecoder.decode(value, { stream: true });
            buffer += chunk;

            // Split on '\n\n' to parse individual SSE frames
            const frames = buffer.split("\n\n");
            // Keep the last incomplete frame in buffer
            const incompleteFrame = frames.pop();
            buffer = incompleteFrame || "";

            // buffer will be:
            // - an empty string (everything completed), or
            // - an incomplete SSE message waiting for more data.

            // Parse SSE format: "data: {...}"(process only the remaining complete frames)
            for (const frame of frames) {
                if (!frame.trim()) continue;

                const match = frame.match(/^data:\s*(.+)$/);
                if (!match) continue;

                // after frame.match() return
                // [
                //     'data: {"type":"chunk","content":"Hello"}', // index 0
                //     '{"type":"chunk","content":"Hello"}'        // index 1
                // ]

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

export interface RegenerateContentInput {
    type?: "ad" | "caption" | "email";
    prompt?: string;
    tone?: string;
    keywords?: string[];
    length?: "short" | "medium" | "long";
}

/**
 * Streams AI content regeneration from the API using Server-Sent Events (SSE).
 *
 * @param campaignId - The ID of the campaign
 * @param outputId - The ID of the AI output to regenerate
 * @param payload - Optional regeneration input parameters (all fields optional)
 * @param handlers - Callback functions for handling streaming events
 * @param handlers.onChunk - Called when a chunk of content is received
 * @param handlers.onDone - Called when regeneration completes successfully with the final output
 * @param handlers.onError - Called when an error occurs during regeneration
 * @param signal - Optional AbortSignal to cancel the request
 * @returns Promise that resolves when streaming completes or is aborted
 */
export async function streamRegeneration(
    campaignId: string,
    outputId: string,
    payload: RegenerateContentInput,
    handlers: {
        onChunk: (text: string) => void;
        onDone: (output: AiOutput) => void;
        onError: (message: string) => void;
    },
    signal?: AbortSignal
): Promise<void> {
    try {
        const apiBaseUrl =
            typeof window === "undefined"
                ? process.env.NEXT_PUBLIC_API_BASE_URL
                : "/api/v1";
        const response = await fetch(
            `${apiBaseUrl}/campaigns/${campaignId}/ai-outputs/${outputId}/regenerate`,
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
            throw new Error(errorText || "Failed to start regeneration");
        }

        const reader = response.body?.getReader();
        const textDecoder = new TextDecoder();

        if (!reader) {
            throw new Error("Response body is not readable");
        }

        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            const chunk = textDecoder.decode(value, { stream: true });
            buffer += chunk;

            const frames = buffer.split("\n\n");
            const incompleteFrame = frames.pop();
            buffer = incompleteFrame || "";

            for (const frame of frames) {
                if (!frame.trim()) continue;

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
                            handlers.onError(data.message || "Regeneration failed");
                            return;
                    }
                } catch (e) {
                    console.error("Failed to parse SSE frame:", e);
                }
            }
        }
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            return;
        }
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
        handlers.onError(errorMessage);
    }
}
