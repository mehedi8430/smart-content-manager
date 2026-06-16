"use server";

import { config } from "@/config/env-config";
import { cookies } from "next/headers";

/**
 * Fetcher function for making API requests with minimal error handling.
 * Returns raw response or throws raw error.
 * @param endpoint - API endpoint (without the base URL)
 * @param options - Fetch options
 * @returns Promise with the response data
 */
export async function fetcher<T = unknown>(
    endpoint: string,
    options?: RequestInit,
): Promise<T> {
    if (!endpoint) {
        throw new Error("Endpoint is required for fetcher");
    }

    const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
    const url = `${config.baseURL}/${cleanEndpoint}`;
    const systemKey = process.env.NEXT_PUBLIC_SYSTEM_KEY as string;

    // Don't add auth header for auth endpoints
    const isAuthEndpoint = [
        "/auth/login",
        "/auth/register",
        "/auth/refresh-token"
    ].includes(cleanEndpoint);

    let accessToken: string | undefined;

    if (!isAuthEndpoint) {
        const cookieStore = await cookies();
        accessToken = cookieStore.get("accessToken")?.value;
    }

    const defaultOptions: RequestInit = {
        credentials: 'include',
        headers: {
            Accept: "application/json",
            ...(systemKey && {
                "System-Key": systemKey
            }),
            // Only set Content-Type for non-FormData requests
            ...(!(options?.body instanceof FormData) && {
                "Content-Type": "application/json",
            }),
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
    };

    const fetchOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options?.headers,
        },
    };

    let response = await fetch(url, fetchOptions);

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && !isAuthEndpoint) {
        console.log("Access token expired. Refreshing...");

        const refreshResponse = await fetch(
            `${config.baseURL}/auth/refresh-token`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    ...(systemKey && {
                        "System-Key": systemKey,
                    }),
                },
            }
        );

        if (refreshResponse.ok) {
            console.log("Token refreshed successfully");

            // get new access token from cookies
            const cookieStore = await cookies();
            const newAccessToken = cookieStore.get("accessToken")?.value;

            // retry original request
            response = await fetch(url, {
                ...fetchOptions,
                headers: {
                    ...fetchOptions.headers,
                    ...(newAccessToken && {
                        Authorization: `Bearer ${newAccessToken}`,
                    }),
                },
            });
        } else {
            throw new Error("Session expired. Please login again.");
        }
    }

    // Check if response has content
    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    const text = await response.text();

    // Log response data for debugging
    if (text) {
        try {
            console.log("response from fetcher", isJson ? JSON.parse(text) : text);
        } catch {
            console.log("response from fetcher", text);
        }
    }

    if (!text) {
        return null as T;
    }

    // If not ok, throw a rich error so frontend can handle it
    if (!response.ok) {
        // Define a flexible error response type
        type ErrorResponse = {
            message?: string;
            detail?: string;
            error?: string;
            code?: string | number;
            [key: string]: unknown;
        };

        let errorData: unknown;

        if (isJson) {
            try {
                errorData = JSON.parse(text);
            } catch {
                errorData = text;
            }
        } else {
            errorData = text;
        }

        // Determine the best error message to surface
        let errorMessage = `Request failed with status ${response.status}`;
        if (errorData && typeof errorData === "object") {
            const err = errorData as ErrorResponse;
            if (err.message) errorMessage = String(err.message);
            else if (err.detail) errorMessage = String(err.detail);
            else if (err.error) errorMessage = String(err.error);
            else if (err.code) errorMessage = `Error code: ${String(err.code)}`;
        } else if (typeof errorData === "string" && errorData.length) {
            errorMessage = errorData;
        }

        class FetcherError extends Error {
            status: number;
            data: unknown;
            constructor(message: string, status: number, data: unknown) {
                super(message);
                this.status = status;
                this.data = data;
            }
        }
        throw new FetcherError(errorMessage, response.status, errorData);
    }

    // Only parse as JSON if content-type indicates JSON
    if (isJson) {
        try {
            return JSON.parse(text) as T;
        } catch {
            // If JSON parsing fails, return text as fallback
            return text as T;
        }
    }

    // For non-JSON responses, return the text or null
    return (text || null) as T;
}

export default fetcher;
