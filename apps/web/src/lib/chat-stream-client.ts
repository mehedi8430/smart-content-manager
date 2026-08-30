import type { ChatMessage } from "@/types/chat.type";

/**
 * Streams a chat reply from the API using Server-Sent Events (SSE).
 *
 * NOTE: We deliberately use raw `fetch()` + `ReadableStream` here instead of
 * EventSource. EventSource only supports GET and cannot send a POST body or
 * per-request auth headers/cookies cleanly, whereas this route needs a POST
 * body (`{ content }`) and the same credentialed session as the rest of the
 * app. This is the same reasoning the content-generator SSE client uses — the
 * streaming endpoint is the one deliberate exception to the Axios/TanStack
 * Query data layer, because SSE cannot flow through mutation machinery.
 *
 * @param sessionId - The chat session to append the reply to
 * @param content - The user's message
 * @param handlers - Callbacks invoked per chunk / on done / on error
 * @param signal - Optional AbortSignal to cancel the request
 */
export async function streamChatMessage(
  sessionId: string,
  content: string,
  handlers: {
    onChunk: (text: string) => void;
    onDone: (message: ChatMessage) => void;
    onError: (message: string) => void;
  },
  signal?: AbortSignal,
): Promise<void> {
  try {
    const apiBaseUrl =
      typeof window === "undefined"
        ? process.env.NEXT_PUBLIC_API_BASE_URL
        : "/api/v1";
    const response = await fetch(
      `${apiBaseUrl}/chat/sessions/${sessionId}/messages/stream`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
        signal,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to start chat stream");
    }

    const reader = response.body?.getReader();
    const textDecoder = new TextDecoder();

    if (!reader) {
      throw new Error("Response body is not readable");
    }

    let buffer = "";

    while (true) {
      // Instead of waiting for the entire response, read chunks (bytes) as they arrive.
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunk = textDecoder.decode(value, { stream: true });
      buffer += chunk;

      // Split on '\n\n' to parse individual SSE frames.
      const frames = buffer.split("\n\n");
      // Keep the last incomplete frame in buffer.
      const incompleteFrame = frames.pop();
      buffer = incompleteFrame || "";

      // Parse SSE format: "data: {...}" (process only the remaining complete frames).
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
      // Silently return on abort (intentional cancel).
      return;
    }
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    handlers.onError(errorMessage);
  }
}
