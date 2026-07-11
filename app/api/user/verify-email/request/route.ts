import { NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/tokens";

/**
 * BFF: Send an email-verification OTP to the authenticated user's own email.
 * POST /api/user/verify-email/request
 *
 * The identifier is always derived from the authenticated session server-side
 * (never taken from the client) so a user can only trigger verification for
 * their own address.
 *
 * Proxies to DRF POST /api/v1/accounts/get-otp/ — { kind: "email", identifier, purpose: "verify" }
 */
export async function POST() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  try {
    const userResult = await serverApi.get<{ message: string; data: { email: string } }>(
      "/accounts/get-user/",
      { token: accessToken },
    );
    const email = userResult.data.email;

    await serverApi.post("/accounts/get-otp/", {
      json: { kind: "email", identifier: email, purpose: "verify" },
    });

    return NextResponse.json({ success: true, message: "OTP sent to your email." });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json({ message: "Unexpected error." }, { status: 500 });
  }
}
