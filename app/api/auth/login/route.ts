import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { setAuthCookies } from "@/lib/auth/tokens";
import { validateLogin } from "@/lib/auth/validation";

/**
 * DRF login response shape:
 * POST /api/v1/accounts/login/ → { access, refresh }
 */
type LoginResponse = {
  access: string;
  refresh: string;
};

/**
 * BFF login endpoint.
 *
 * The browser posts JSON here (same-origin, avoiding the backend's lack of
 * CORS). We forward credentials to DRF's JWT login, then store the returned
 * tokens in httpOnly cookies so they never touch client JS.
 */
export async function POST(request: NextRequest) {
  let payload: { email?: unknown; password?: unknown; rememberMe?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid request body.", status: 400 },
      { status: 400 },
    );
  }

  const { errors, valid } = validateLogin(payload);
  if (!valid) {
    return NextResponse.json(
      { message: "Please check the form and try again.", status: 422, errors },
      { status: 422 },
    );
  }

  const email = String(payload.email).trim();
  const password = String(payload.password);
  const rememberMe = payload.rememberMe === true;

  try {
    // DRF's TokenObtainPairView expects JSON: { email, password, remember_me }
    const tokens = await serverApi.post<LoginResponse>("/accounts/login/", {
      json: { email, password, remember_me: rememberMe },
    });

    await setAuthCookies({
      accessToken: tokens.access,
      refreshToken: tokens.refresh,
      rememberMe,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ApiError) {
      // DRF returns 401 for invalid credentials with { detail: "..." }
      const message =
        error.status === 401
          ? "Incorrect email or password."
          : error.message;
      return NextResponse.json(
        { message, status: error.status },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { message: "Unexpected error. Please try again.", status: 500 },
      { status: 500 },
    );
  }
}
