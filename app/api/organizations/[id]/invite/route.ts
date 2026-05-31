import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/tokens";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * BFF: Send an organization invite.
 * POST /api/organizations/[id]/invite
 * Body: { email: string; role: string }
 * Proxies to DRF POST /api/v1/organizations/sent-invite/?org_id=<id>
 *
 * DRF returns: { message: "Invite sent successfully", invite_token: "..." }
 * DRF errors:
 *   - 404 { detail: "User not found" }           → user doesn't have a Structra account
 *   - 400 { non_field_errors: ["..."] }           → already a member / already invited
 *   - 403 { detail: "..." }                       → permission denied
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  let body: { email?: unknown; role?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = typeof body.role === "string" ? body.role.trim() : "MEMBER";

  // Client-side guard (belt-and-suspenders — modal also validates)
  if (!email) {
    return NextResponse.json(
      { message: "Email address is required.", field: "email" },
      { status: 422 },
    );
  }
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { message: "Enter a valid email address.", field: "email" },
      { status: 422 },
    );
  }

  try {
    const result = await serverApi.post<{ message: string; invite_token: string }>(
      `/organizations/sent-invite/?org_id=${id}`,
      { token: accessToken, json: { email, role } },
    );
    return NextResponse.json({ message: result.message, invite_token: result.invite_token });
  } catch (error) {
    if (error instanceof ApiError) {
      const msg = error.message.toLowerCase();

      // Map backend error messages to user-friendly field errors
      if (error.status === 404 || msg.includes("not found")) {
        return NextResponse.json(
          {
            message: "No Structra account found with this email address.",
            field: "email",
          },
          { status: 404 },
        );
      }
      if (msg.includes("already") && msg.includes("member")) {
        return NextResponse.json(
          {
            message: "This person is already a member of the organization.",
            field: "email",
          },
          { status: 400 },
        );
      }
      if (msg.includes("already") && msg.includes("invite")) {
        return NextResponse.json(
          {
            message: "An invite has already been sent to this email.",
            field: "email",
          },
          { status: 400 },
        );
      }
      if (msg.includes("yourself")) {
        return NextResponse.json(
          { message: "You cannot invite yourself.", field: "email" },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json({ message: "Unexpected error." }, { status: 500 });
  }
}
