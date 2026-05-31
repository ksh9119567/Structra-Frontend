import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/tokens";

type RouteContext = { params: Promise<{ id: string; memberEmail: string }> };

const VALID_ROLES = ["MANAGER", "LEAD", "MEMBER", "VIEWER"];

/**
 * BFF: Update a member's role in a team.
 * PUT /api/teams/[id]/members/[memberEmail]
 * Body: { role: string }
 * Proxies to DRF PUT /api/v1/teams/update-member/?team_id=<id>
 * Body to DRF: { email, role }
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id, memberEmail } = await params;
  const email = decodeURIComponent(memberEmail);

  let body: { role?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const role = typeof body.role === "string" ? body.role.trim() : "";
  if (!role) {
    return NextResponse.json(
      { message: "Role is required.", field: "role" },
      { status: 422 },
    );
  }
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json(
      { message: "Invalid role.", field: "role" },
      { status: 422 },
    );
  }

  try {
    const result = await serverApi.put<{ message: string; data: unknown }>(
      `/teams/update-member/?team_id=${id}`,
      { token: accessToken, json: { email, role } },
    );
    return NextResponse.json({ message: result.message, data: result.data });
  } catch (error) {
    if (error instanceof ApiError) {
      const msg = error.message.toLowerCase();

      if (msg.includes("equal or higher role")) {
        return NextResponse.json(
          { message: "You cannot modify a member with an equal or higher role.", field: "role" },
          { status: 400 },
        );
      }
      if (msg.includes("assign a role equal")) {
        return NextResponse.json(
          { message: "You cannot assign a role equal to or higher than your own.", field: "role" },
          { status: 400 },
        );
      }
      if (msg.includes("last remaining")) {
        return NextResponse.json(
          { message: "Cannot change the role of the last remaining Manager.", field: "role" },
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

/**
 * BFF: Remove a member from a team.
 * DELETE /api/teams/[id]/members/[memberEmail]
 * Proxies to DRF DELETE /api/v1/teams/remove-member/ body: { team_id, email }
 */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id, memberEmail } = await params;
  const email = decodeURIComponent(memberEmail);

  try {
    await serverApi.delete("/teams/remove-member/", {
      token: accessToken,
      json: { team_id: id, email },
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
