import { api } from "@/api/axios";
import type { AiOutput } from "@/types/ai-output.type";

/**
 * Thin data layer for AI outputs.
 *
 * These are plain async functions (not React Query hooks) so they can also be
 * fed to `queryFn` / `mutationFn`. They deliberately RETURN UNWRAPPED DATA
 * (e.g. `AiOutput[]`, not `{ success, data, message }`): the Express API wraps
 * every response in that envelope, but callers shouldn't have to know or repeat
 * that shape. Any failure is converted to a clean `Error` carrying the
 * backend's `message` here, ONCE, instead of in every hook that uses it.
 */

/** The envelope shape the Express API returns. */
interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Convert any thrown value into a clean Error. Axios rejects non-2xx responses,
 * and the backend's error body is `{ success: false, message }`, so we surface
 * that `message` directly. Falls back to a generic message for network errors.
 */
function toAppError(error: unknown): Error {
  // Axios rejects non-2xx responses; the backend error body is
  // `{ success: false, message }`, so surface that message directly.
  if (error && typeof error === "object" && "response" in error) {
    const res = (
      error as { response?: { data?: { message?: string }; status?: number } }
    ).response;
    if (res?.data?.message) {
      return new Error(res.data.message);
    }
    if (res?.status) {
      return new Error(`Request failed with status ${res.status}`);
    }
  }
  if (error instanceof Error) return error;
  return new Error("Unexpected error occurred");
}

/** List every AI output for a campaign. */
export async function listAiOutputs(campaignId: string): Promise<AiOutput[]> {
  try {
    const res = await api.get<ApiEnvelope<AiOutput[]>>(
      `/campaigns/${campaignId}/ai-outputs`,
    );
    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to fetch AI outputs");
    }
    return res.data.data ?? [];
  } catch (error) {
    throw toAppError(error);
  }
}

/** Fetch a single AI output by id. */
export async function getAiOutput(
  campaignId: string,
  id: string,
): Promise<AiOutput> {
  try {
    const res = await api.get<ApiEnvelope<AiOutput>>(
      `/campaigns/${campaignId}/ai-outputs/${id}`,
    );
    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to fetch AI output");
    }
    return res.data.data as AiOutput;
  } catch (error) {
    throw toAppError(error);
  }
}

/** Delete an AI output. Resolves with no value on success. */
export async function deleteAiOutput(
  campaignId: string,
  id: string,
): Promise<void> {
  try {
    const res = await api.delete<ApiEnvelope<unknown>>(
      `/campaigns/${campaignId}/ai-outputs/${id}`,
    );
    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to delete AI output");
    }
  } catch (error) {
    throw toAppError(error);
  }
}
