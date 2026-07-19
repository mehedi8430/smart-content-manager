import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { config } from "@/config/env-config";

export const api: AxiosInstance = axios.create({
  baseURL: config.baseURL,
  timeout: config.defaultTimeout,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

/**
 * Ensure only one refresh request runs at a time.
 *
 * If multiple requests receive 401s simultaneously (e.g. after token expiry),
 * only the first calls `/auth/refresh-token`. Others wait for the same refresh
 * promise and retry, avoiding duplicate refreshes and token churn.
 */
let refreshPromise: Promise<unknown> | null = null;

function refreshAccessTokenOnce(): Promise<unknown> {
  if (!refreshPromise) {
    refreshPromise = api.post("/auth/refresh-token")
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function isAuthRequest(url?: string): boolean {
  if (!url) return false;
  return /(^|\/)auth(\/|$)/.test(url);
}

/**
 * Central 401 handler. Returns the retried response on success, or a rejected
 * error (which Axios propagates to the caller's try/catch) on any failure.
 */
async function handleUnauthorized(error: AxiosError): Promise<unknown> {
  const originalRequest = error.config as
    | (InternalAxiosRequestConfig & { _retry?: boolean })
    | undefined;

  // 1) Only retry 401s; all other errors are passed through unchanged.
  if (!originalRequest || error.response?.status !== 401) {
    return Promise.reject(error);
  }

  // 2) Never refresh auth requests or the refresh request itself.
  if (isAuthRequest(originalRequest.url)) {
    return Promise.reject(error);
  }

  // 3) Retry each request only once to prevent infinite refresh loops.
  if (originalRequest._retry) {
    return Promise.reject(error);
  }
  originalRequest._retry = true;

  try {
    // 4) Share a single refresh request across concurrent 401s, then retry automatically.
    await refreshAccessTokenOnce();

    // The browser automatically sends the new httpOnly access-token cookie on retry.
    return api(originalRequest);
  } catch (refreshError) {
    // 5) Refresh failed and auth cookies were cleared by the backend; redirect to login.
    if (typeof window !== "undefined") {
      window.location.assign("/login");
    }
    return Promise.reject(refreshError);
  }
}

api.interceptors.response.use(
  (response) => response,
  (error) => handleUnauthorized(error),
);

export default api;
