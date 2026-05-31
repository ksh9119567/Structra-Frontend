// NOTE: This module is server-only. It relies on next/headers `cookies()`,
// which throws if imported into a Client Component, so it cannot leak to the client.
import { cookies } from "next/headers";

import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
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
