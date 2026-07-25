import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/tokens";
import { TEAM_ASSIGNABLE_ROLES } from "@/lib/roles";
import type { ProjectTeamLink } from "@/lib/projects/types";

type RouteContext = { params: Promise<{ id: string; teamId: string }> };

/**
 * BFF: Update a team's link to a project (role and/or owning flag).
 * PUT /api/projects/[id]/teams/[teamId]
 * Body: { role?: string; is_owning?: boolean }
 * Proxies to DRF PUT /api/v1/projects/update-team-role/?project_id=<id>
 * Body to DRF: { team_id, role?, is_owning? }
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id, teamId } = await params;

  let body: { role?: unknown; is_owning?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const payload: { team_id: string; role?: string; is_owning?: boolean } = { team_id: teamId };

  if (body.role !== undefined) {
    const role = typeof body.role === "string" ? body.role.trim() : "";
    if (!role || !TEAM_ASSIGNABLE_ROLES.includes(role as (typeof TEAM_ASSIGNABLE_ROLES)[number])) {
      return NextResponse.json({ message: "Invalid role.", field: "role" }, { status: 422 });
    }
    payload.role = role;
  }
  if (body.is_owning !== undefined) {
    if (typeof body.is_owning !== "boolean") {
      return NextResponse.json({ message: "is_owning must be a boolean.", field: "is_owning" }, { status: 422 });
    }
    payload.is_owning = body.is_owning;
  }
  if (payload.role === undefined && payload.is_owning === undefined) {
    return NextResponse.json(
      { message: "Provide a role and/or is_owning to update." },
      { status: 422 },
    );
  }

  try {
    const result = await serverApi.put<{ message: string; data: ProjectTeamLink }>(
      `/projects/update-team-role/?project_id=${id}`,
      { token: accessToken, json: payload },
    );
    return NextResponse.json(result.data);
  } catch (error) {
    if (error instanceof ApiError) {
      const msg = error.message.toLowerCase();
      if (msg.includes("unflag the owning team")) {
        return NextResponse.json(
          { message: "Assign a different team as owning first, or unassign this team instead.", field: "is_owning" },
          { status: 400 },
        );
      }
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unexpected error." }, { status: 500 });
  }
}

/**
 * BFF: Unassign a team from a project.
 * DELETE /api/projects/[id]/teams/[teamId]
 * Proxies to DRF DELETE /api/v1/projects/unassign-team/?project_id=<id> body: { team_id }
 */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id, teamId } = await params;

  try {
    await serverApi.delete(`/projects/unassign-team/?project_id=${id}`, {
      token: accessToken,
      json: { team_id: teamId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unexpected error." }, { status: 500 });
  }
}
