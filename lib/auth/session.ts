/**
 * Server-only session helpers.
 *
 * Uses React `cache()` so that multiple server components in the same render
 * tree (layout + page) share a single backend call per request — no duplicate
 * GET /accounts/get-user/ hits within one render.
 */
import { cache } from "react";
import { redirect } from "next/navigation";

import { getAccessToken, clearAuthCookies } from "./tokens";
import { getApiBaseUrl, LOGIN_PATH } from "./config";
import type { AuthUser } from "./types";

type GetUserResponse = {
  message: string;
  data: AuthUser;
};

/**
 * Fetch the current user from the backend.
 * Cached per-request: called from layout AND page → only one HTTP request.
 * Returns null if unauthenticated or token is invalid.
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  try {
    const res = await fetch(`${getApiBaseUrl()}/accounts/get-user/`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (res.status === 401 || res.status === 403) {
      await clearAuthCookies();
      return null;
    }

    if (!res.ok) return null;

    const data: GetUserResponse = await res.json();
    return data.data;
  } catch {
    return null;
  }
});

/**
 * Like getCurrentUser but redirects to login if the session is invalid.
 * Use this in layouts/pages that require authentication.
 */
export const requireUser = cache(async (): Promise<AuthUser> => {
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_PATH);
  return user;
});
