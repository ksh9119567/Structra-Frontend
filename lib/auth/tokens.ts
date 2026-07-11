// NOTE: This module is server-only. It relies on next/headers `cookies()`,
// which throws if imported into a Client Component, so it cannot leak to the client.
import { cookies } from "next/headers";

import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
  getApiBaseUrl,
} from "./config";

type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

const isProduction = process.env.NODE_ENV === "production";

const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/",
};

/** Persist the access + refresh tokens as httpOnly cookies. */
export async function setAuthCookies({ accessToken, refreshToken }: TokenPair) {
  const cookieStore = await cookies();

  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...baseCookieOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...baseCookieOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

/** Remove both auth cookies (logout / invalid session). */
export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
}

export async function isAuthenticated(): Promise<boolean> {
  return Boolean(await getAccessToken());
}

/**
 * Exchanges the refresh token cookie for a fresh access/refresh pair and
 * rotates both cookies. This is what lets a session survive past the access
 * token's 30-minute lifetime without forcing a full re-login, as long as the
 * refresh token (7-day lifetime) is still valid.
 *
 * Returns the new access token on success. Returns null (and clears cookies)
 * if there's no refresh token or the backend rejects it. On a network error
 * it also returns null but leaves cookies alone, since that's likely
 * transient rather than a genuinely invalid session.
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${getApiBaseUrl()}/accounts/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
      cache: "no-store",
    });

    if (!res.ok) {
      await clearAuthCookies();
      return null;
    }

    const data: { access: string; refresh: string } = await res.json();
    await setAuthCookies({ accessToken: data.access, refreshToken: data.refresh });
    return data.access;
  } catch {
    return null;
  }
}

/**
 * Validates the stored access token against the backend.
 * Returns true only if the backend confirms the token is valid (refreshing
 * once first if the access token has expired). Clears cookies if the
 * refresh token is also rejected.
 */
export async function verifySession(): Promise<boolean> {
  const accessToken = await getAccessToken();
  if (!accessToken) return false;

  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/accounts/get-user/`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (res.status === 401 || res.status === 403) {
      const newToken = await refreshAccessToken();
      if (!newToken) return false;

      const retryRes = await fetch(`${baseUrl}/accounts/get-user/`, {
        method: "GET",
        headers: { Authorization: `Bearer ${newToken}` },
        cache: "no-store",
      });
      return retryRes.ok;
    }

    return res.ok;
  } catch {
    // Backend unreachable — don't clear cookies, just treat as unauthenticated
    return false;
  }
}
