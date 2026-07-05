/**
 * Shared auth configuration and cookie names.
 *
 * Tokens are stored in httpOnly cookies and never exposed to client JS, as
 * recommended by the backend's authentication docs. The browser talks only to
 * same-origin Next.js Route Handlers (the BFF), which proxy to the DRF backend.
 */

export const ACCESS_TOKEN_COOKIE = "structra_access_token";
export const REFRESH_TOKEN_COOKIE = "structra_refresh_token";

// Mirrors the backend token lifetimes (SIMPLE_JWT settings).
export const ACCESS_TOKEN_MAX_AGE = 30 * 60; // 30 minutes, in seconds
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days, in seconds

/** Base URL of the DRF backend. Server-side only. */
export function getApiBaseUrl(): string {
  const url = process.env.STRUCTRA_API_URL;
  if (!url) {
    throw new Error(
      "STRUCTRA_API_URL is not set. Add it to .env.local (e.g. http://localhost:8000/api/v1).",
    );
  }
  return url.replace(/\/$/, "");
}

export const LOGIN_PATH = "/login";
export const SIGNUP_PATH = "/signup";
export const DASHBOARD_PATH = "/dashboard";
