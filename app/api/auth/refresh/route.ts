import { NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import {
  clearAuthCookies,
  getRefreshToken,
  setAuthCookies,
} from "@/lib/auth/tokens";

type RefreshResponse = {
  access: string;
  refresh: string;
};

/**
 * BFF token refresh. Exchanges the stored refresh token for a fresh token pair
 * and rotates the cookies. Clears the session if the refresh token is invalid.
 *
 * DRF endpoint: POST /api/v1/accounts/token/refresh/ — JSON { refresh }
 */
export async function POST() {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    return NextResponse.json(
      { message: "Session expired. Please sign in again.", status: 401 },
      { status: 401 },
    );
  }

  try {
    const tokens = await serverApi.post<RefreshResponse>(
      "/accounts/token/refresh/",
      {
        json: { refresh: refreshToken },
      },
    );

    await setAuthCookies({
      accessToken: tokens.access,
      refreshToken: tokens.refresh,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    await clearAuthCookies();
    const status = error instanceof ApiError ? error.status : 401;
    return NextResponse.json(
      { message: "Session expired. Please sign in again.", status },
      { status },
    );
  }
}
