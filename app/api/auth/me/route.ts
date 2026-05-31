import { NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { clearAuthCookies, getAccessToken } from "@/lib/auth/tokens";

/**
 * DRF get-user response shape:
 * GET /api/v1/accounts/get-user/ → { message, data: { ...user } }
 */
type GetUserResponse = {
  message: string;
  data: {
    id: string;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    profile_picture: string | null;
    phone_number: string | null;
    is_email_verified: boolean;
    is_phone_verified: boolean;
    is_active: boolean;
    is_staff: boolean;
    date_joined: string;
  };
};

export async function GET() {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  try {
    const result = await serverApi.get<GetUserResponse>("/accounts/get-user/", {
      token: accessToken,
    });
    return NextResponse.json(result.data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      // Token is invalid/expired — clear cookies so the client gets redirected
      await clearAuthCookies();
      return NextResponse.json({ message: "Session expired" }, { status: 401 });
    }
    return NextResponse.json(
      { message: "Failed to fetch user" },
      { status: 500 },
    );
  }
}
