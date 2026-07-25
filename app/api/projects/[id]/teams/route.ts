import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/tokens";
import { TEAM_ASSIGNABLE_ROLES } from "@/lib/roles";
import type { ProjectTeamLink } from "@/lib/projects/types";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * BFF: List teams assigned to a project.
 * GET /api/projects/[id]/teams
 * Proxies to DRF GET /api/v1/projects/get-project-teams/?project_id=<id>
 * Not paginated — DRF returns { message, data: ProjectTeamLink[] } directly.
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await serverApi.get<{ message: string; data: ProjectTeamLink[] }>(
      `/projects/get-project-teams/?project_id=${id}`,
      { token: accessToken },
    );
    return NextResponse.json(result.data);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unexpected error." }, { status: 500 });
  }
}

/**
 * BFF: Assign a team to a project.
 * POST /api/projects/[id]/teams
 * Body: { team_id: string; role: string; is_owning?: boolean }
 * Proxies to DRF POST /api/v1/projects/assign-team/?project_id=<id>
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  let body: { team_id?: unknown; role?: unknown; is_owning?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const teamId = typeof body.team_id === "string" ? body.team_id : "";
  if (!teamId) {
    return NextResponse.json(
      { message: "A team is required.", field: "team_id" },
      { status: 422 },
    );
  }
  const role = typeof body.role === "string" ? body.role.trim() : "";
  if (!role || !TEAM_ASSIGNABLE_ROLES.includes(role as (typeof TEAM_ASSIGNABLE_ROLES)[number])) {
    return NextResponse.json(
      { message: "Invalid role.", field: "role" },
      { status: 422 },
    );
  }
  const isOwning = typeof body.is_owning === "boolean" ? body.is_owning : undefined;

  try {
    const result = await serverApi.post<{ message: string; data: ProjectTeamLink }>(
      `/projects/assign-team/?project_id=${id}`,
      { token: accessToken, json: { team_id: teamId, role, ...(isOwning !== undefined ? { is_owning: isOwning } : {}) } },
    );
    return NextResponse.json(result.data);
  } catch (error) {
    if (error instanceof ApiError) {
      const msg = error.message.toLowerCase();
      if (msg.includes("permission")) {
        return NextResponse.json({ message: error.message, field: "team_id" }, { status: 403 });
      }
      if (msg.includes("same organization")) {
        return NextResponse.json({ message: error.message, field: "team_id" }, { status: 400 });
      }
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unexpected error." }, { status: 500 });
  }
}
