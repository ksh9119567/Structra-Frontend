import { NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import {
  clearAuthCookies,
  getAccessToken,
  getRefreshToken,
} from "@/lib/auth/tokens";

/**
 * BFF logout endpoint. Revokes the session on the backend (best effort) and
 * always clears local cookies so the user ends up logged out either way.
 *
 * DRF endpoint: POST /api/v1/accounts/logout/ — Bearer auth + JSON { refresh, access }
 */
export async function POST() {
  const accessToken = await getAccessToken();
  const refreshToken = await getRefreshToken();

  if (accessToken && refreshToken) {
    try {
      await serverApi.post("/accounts/logout/", {
        token: accessToken,
        json: { refresh: refreshToken, access: accessToken },
      });
    } catch {
      // Backend revocation failed (e.g. already expired). We still clear
      // cookies below so the client session is terminated regardless.
    }
  }

  await clearAuthCookies();
  return NextResponse.json({ success: true });
}
