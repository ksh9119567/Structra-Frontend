import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError, extractDetail } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/tokens";
import type { AuthUser } from "@/lib/auth/types";

type UpdateUserResponse = {
  message: string;
  data: AuthUser;
};

/**
 * BFF: Update the authenticated user's profile.
 * PUT /api/user/profile
 * Body: { username?, first_name?, last_name?, phone_number? }
 * Proxies to DRF PUT /api/v1/accounts/update_user/
 */
export async function PUT(request: NextRequest) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  try {
    const result = await serverApi.put<UpdateUserResponse>("/accounts/update_user/", {
      token: accessToken,
      json: body,
    });
    return NextResponse.json(result.data);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message, status: error.status },
        { status: error.status },
      );
    }
    return NextResponse.json({ message: "Unexpected error." }, { status: 500 });
  }
}

/**
 * BFF: Delete the authenticated user's account.
 * DELETE /api/user/profile
 * Proxies to DRF DELETE /api/v1/accounts/delete_user/
 */
export async function DELETE() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  try {
    await serverApi.delete("/accounts/delete_user/", { token: accessToken });
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

/**
 * BFF: Get the authenticated user's profile.
 * GET /api/user/profile
 * Proxies to DRF GET /api/v1/accounts/get-user/
 */
export async function GET() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  try {
    const result = await serverApi.get<{ message: string; data: AuthUser }>(
      "/accounts/get-user/",
      { token: accessToken },
    );
    return NextResponse.json(result.data);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof ApiError
      ? error.message
      : extractDetail(error, "Failed to fetch profile.");
    return NextResponse.json({ message }, { status });
  }
}
