import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";

/**
 * BFF: Verify OTP for password reset.
 * POST /api/auth/forgot-password/verify
 * Body: { kind, identifier, otp }
 * Proxies to DRF POST /api/v1/accounts/forgot-password/verify/
 * Returns: { reset_token: string }
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  try {
    const result = await serverApi.post<{ message: string }>(
      "/accounts/forgot-password/verify/",
      { json: body },
    );
    // DRF returns { message: "<reset_token>" }
    return NextResponse.json({ reset_token: result.message });
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
