import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { setAuthCookies } from "@/lib/auth/tokens";
import { validateSignup } from "@/lib/auth/validation";

/**
 * DRF register response shape:
 * POST /api/v1/accounts/register/ → { message, user, access, refresh }
 */
type RegisterResponse = {
  message: string;
  user: {
    id: string;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    is_email_verified: boolean;
    is_active: boolean;
  };
  access: string;
  refresh: string;
};

/**
 * BFF signup endpoint.
 *
 * Accepts JSON from the browser, validates, forwards to DRF's
 * POST /accounts/register/, then stores the returned tokens as httpOnly cookies
 * (the backend auto-logs in after registration).
 */
export async function POST(request: NextRequest) {
  let payload: {
    username?: unknown;
    email?: unknown;
    password?: unknown;
    confirmPassword?: unknown;
    firstName?: unknown;
    lastName?: unknown;
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid request body.", status: 400 },
      { status: 400 },
    );
  }

  const { errors, valid } = validateSignup(payload);
  if (!valid) {
    return NextResponse.json(
      { message: "Please check the form and try again.", status: 422, errors },
      { status: 422 },
    );
  }

  const username = String(payload.username).trim();
  const email = String(payload.email).trim();
  const password = String(payload.password);
  const firstName =
    typeof payload.firstName === "string" ? payload.firstName.trim() : "";
  const lastName =
    typeof payload.lastName === "string" ? payload.lastName.trim() : "";

  try {
    const result = await serverApi.post<RegisterResponse>(
      "/accounts/register/",
      {
        json: {
          email,
          username,
          password,
          first_name: firstName,
          last_name: lastName,
        },
      },
    );

    await setAuthCookies({
      accessToken: result.access,
      refreshToken: result.refresh,
    });

    return NextResponse.json({ success: true, user: result.user });
  } catch (error) {
    if (error instanceof ApiError) {
      // DRF validation errors come as { email: ["..."], username: ["..."] }
      const isEmailTaken =
        error.status === 400 &&
        error.message.toLowerCase().includes("email");

      if (isEmailTaken) {
        return NextResponse.json(
          {
            message: "This email is already registered.",
            status: 400,
            errors: { email: "This email is already registered." },
          },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { message: error.message, status: error.status },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { message: "Unexpected error. Please try again.", status: 500 },
      { status: 500 },
    );
  }
}
