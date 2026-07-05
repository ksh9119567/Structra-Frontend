import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";

/**
 * BFF: Reset password using a verified reset token.
 * PUT /api/auth/forgot-password/reset
 * Body: { reset_token, new_password }
 * Proxies to DRF PUT /api/v1/accounts/forgot-password/reset/
 */
export async function PUT(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  try {
    const result = await serverApi.put<{ message: string }>(
      "/accounts/forgot-password/reset/",
      { json: body },
    );
    return NextResponse.json({ message: result.message });
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
