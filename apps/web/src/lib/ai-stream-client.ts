import { AiOutput } from "@/types/ai-output.type";

export interface GenerateContentInput {
    type: "ad" | "caption" | "email";
    prompt: string;
    tone?: string;
    keywords?: string[];
    length?: "short" | "medium" | "long";
}

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
            `${process.env.NEXT_PUBLIC_API_URL}/campaigns/${campaignId}/ai-outputs/generate`,
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
