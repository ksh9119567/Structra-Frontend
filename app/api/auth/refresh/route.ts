import { NextResponse } from "next/server";

import { refreshAccessToken } from "@/lib/auth/tokens";

/**
 * BFF token refresh. Exchanges the stored refresh token for a fresh token pair
 * and rotates the cookies. Clears the session if the refresh token is invalid.
 *
 * Server-rendered pages and BFF routes already refresh transparently on a
 * 401 (see lib/auth/session.ts and lib/api/server-client.ts) — this endpoint
 * exists for client components that want to proactively refresh.
 *
 * DRF endpoint: POST /api/v1/accounts/token/refresh/ — JSON { refresh }
 */
export async function POST() {
  const accessToken = await refreshAccessToken();

  if (!accessToken) {
    return NextResponse.json(
      { message: "Session expired. Please sign in again.", status: 401 },
      { status: 401 },
    );
  }

  return NextResponse.json({ success: true });
}
