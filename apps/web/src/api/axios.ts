import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { config } from "@/config/env-config";

/**
 * The ONE shared Axios instance for the whole app.
 *
 * Why a single instance:
 *  - Auth is httpOnly-cookie based (see backend `generateToken.ts`), so every
 *    request must travel with credentials. Setting `withCredentials` once here
 *    guarantees we never forget it on an ad-hoc `axios.get` somewhere else.
 *  - The 401 refresh logic (below) is attached to THIS instance only. If other
 *    code created its own Axios instances, those requests would silently skip
 *    token refresh. So: always import `api` from here, never `axios` directly.
 *
 * `baseURL` already includes `/api/v1` (see `env-config.ts`), so API functions
 * pass paths like `/campaigns/:id/ai-outputs`.
 */
export const api: AxiosInstance = axios.create({
  baseURL: config.baseURL,
  timeout: config.defaultTimeout,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

/* -------------------------------------------------------------------------- */
/* Refresh-token concurrency guard                                            */
/* -------------------------------------------------------------------------- */

/**
 * At most ONE refresh request may be in flight at any time.
 *
 * Why this matters (the part most likely to be copied wrong):
 * When a page loads, several queries (list outputs, etc.) can fire at once. If
 * the access token has just expired, ALL of them get a 401 at roughly the same
 * time. Without coordination, each would call `/auth/refresh-token`
 * independently. That is wasteful at best and, because the refresh response
 * re-issues the access-token cookie, can cause multiple overlapping refreshes
 * that churn the refresh token. By funneling every concurrent 401 through a
 * single shared promise, only the FIRST 401 actually hits the network; the
 * rest simply await that one refresh and then retry with the freshest cookie.
 */
let refreshPromise: Promise<unknown> | null = null;

function refreshAccessTokenOnce(): Promise<unknown> {
  // If a refresh is already running, reuse that exact promise.
  if (!refreshPromise) {
    refreshPromise = api
      .post("/auth/refresh-token")
      // Always clear the in-flight flag when the refresh settles, whether it
      // succeeded or failed, so a LATER genuine expiry can start a fresh
      // refresh instead of believing one is still pending.
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/**
 * Requests that are part of the auth flow itself must never trigger a refresh.
 * A failed LOGIN returns 400 (not 401) on this backend, but guarding the whole
 * `/auth` space is defensive: it also stops the refresh call from recursively
 * refreshing itself, and avoids treating auth-route 401s as "expired token".
 */
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

  // 1) Only 401s are refresh-worthy. 403/404/409/422/500/network errors pass
  //    straight through untouched — callers handle those themselves.
  if (!originalRequest || error.response?.status !== 401) {
    return Promise.reject(error);
  }

  // 2) Never refresh an auth-route request (e.g. a failed login), and never
  //    recursively refresh the refresh call itself.
  if (isAuthRequest(originalRequest.url)) {
    return Promise.reject(error);
  }

  // 3) Retry at most ONCE per original request. If `_retry` is already set,
  //    this request was already refreshed and still failed — stop here to
  //    prevent an infinite refresh loop when the refresh itself is broken.
  if (originalRequest._retry) {
    return Promise.reject(error);
  }
  originalRequest._retry = true;

  try {
    // 4) Concurrency: share a single in-flight refresh across all 401s. Every
    //    concurrent caller awaits the SAME promise, then retries with the new
    //    access-token cookie the browser received from the refresh response.
    await refreshAccessTokenOnce();

    // The new access token arrived as an httpOnly cookie on the refresh
    // response, so the browser will automatically attach it when we replay the
    // original request — we do NOT need to read it from the response body.
    return api(originalRequest);
  } catch (refreshError) {
    // 5) Refresh failed (refresh token expired/invalid). The backend already
    //    cleared the auth cookies (see `refreshAccessToken` -> `clearAuthCookies`).
    //    There is no client-side auth store to clear, so just send the user to
    //    the login page so they aren't stuck on a page that silently 401s.
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
