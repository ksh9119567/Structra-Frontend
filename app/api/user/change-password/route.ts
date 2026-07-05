import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/tokens";

/**
 * BFF: Change password for the authenticated user.
 * POST /api/user/change-password
 * Body: { current_password, new_password, confirm_password }
 *
 * The backend doesn't have a dedicated "change password while logged in" endpoint,
 * so we use the forgot-password reset flow: we first verify the current password
 * by attempting a login, then call the reset endpoint.
 *
 * Actually the backend has PUT /accounts/update_user/ which doesn't support password.
 * We'll use a direct approach: verify current password via login, then reset.
 * For now we proxy to a custom endpoint pattern using the existing login + reset.
 */
export async function POST(request: NextRequest) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  let body: { current_password?: unknown; new_password?: unknown; confirm_password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const currentPassword = typeof body.current_password === "string" ? body.current_password : "";
  const newPassword = typeof body.new_password === "string" ? body.new_password : "";
  const confirmPassword = typeof body.confirm_password === "string" ? body.confirm_password : "";

  if (!currentPassword) {
    return NextResponse.json({ message: "Current password is required.", field: "current_password" }, { status: 422 });
  }
  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ message: "New password must be at least 6 characters.", field: "new_password" }, { status: 422 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ message: "Passwords do not match.", field: "confirm_password" }, { status: 422 });
  }

  try {
    // Step 1: Get the current user's email to verify current password
    const userResult = await serverApi.get<{ message: string; data: { email: string } }>(
      "/accounts/get-user/",
      { token: accessToken },
    );
    const email = userResult.data.email;

    // Step 2: Verify current password by attempting login
    try {
      await serverApi.post("/accounts/login/", {
        json: { email, password: currentPassword },
      });
    } catch {
      return NextResponse.json(
        { message: "Current password is incorrect.", field: "current_password" },
        { status: 400 },
      );
    }

    // Step 3: Request a password reset OTP
    const otpResult = await serverApi.post<{ message: string }>(
      "/accounts/forgot-password/request/",
      { json: { kind: "email", identifier: email } },
    );

    return NextResponse.json({
      success: true,
      message: "OTP sent to your email. Please verify to complete password change.",
      step: "otp_required",
      email,
    });
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
