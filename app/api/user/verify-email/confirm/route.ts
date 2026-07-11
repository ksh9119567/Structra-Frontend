import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/tokens";

/**
 * BFF: Confirm an email-verification OTP for the authenticated user's own
 * email, marking it verified on success.
 * POST /api/user/verify-email/confirm
 * Body: { otp: string }
 *
 * Proxies to DRF POST /api/v1/accounts/verify-otp/ — { kind: "email", identifier, otp }
 */
export async function POST(request: NextRequest) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  let body: { otp?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const otp = typeof body.otp === "string" ? body.otp.trim() : "";
  if (!otp) {
    return NextResponse.json({ message: "Verification code is required." }, { status: 422 });
  }

  try {
    const userResult = await serverApi.get<{ message: string; data: { email: string } }>(
      "/accounts/get-user/",
      { token: accessToken },
    );
    const email = userResult.data.email;

    await serverApi.post("/accounts/verify-otp/", {
      json: { kind: "email", identifier: email, otp },
    });

    return NextResponse.json({ success: true });
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
