import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/tokens";
import type { ProjectSummary } from "@/lib/projects/types";
import type { PaginatedResponse } from "@/lib/organizations/types";
import { TEAM_ASSIGNABLE_ROLES } from "@/lib/roles";

/**
 * BFF: List projects the current user belongs to.
 * GET /api/projects?search=&status=&team=&ordering=&page=&page_size=
 * Proxies to DRF GET /api/v1/projects/get-user-projects/
 */
export async function GET(request: NextRequest) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const backendParams = new URLSearchParams();

  const forwarded = ["search", "status", "team", "ordering", "page", "page_size"];
  for (const key of forwarded) {
    const val = searchParams.get(key);
    if (val) backendParams.set(key, val);
  }
  if (!backendParams.has("ordering")) backendParams.set("ordering", "-created_at");

  const query = backendParams.toString();
  const path = `/projects/get-user-projects/${query ? `?${query}` : ""}`;

  try {
    const result = await serverApi.get<PaginatedResponse<ProjectSummary>>(path, {
      token: accessToken,
    });
    return NextResponse.json(result);
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
 * BFF: Create a new project.
 * POST /api/projects
 * Body: { name: string; description?: string; organization_id?: string; team_id?: string; team_role?: string }
 * Proxies to DRF POST /api/v1/projects/create-project/
 */
export async function POST(request: NextRequest) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  let body: {
    name?: unknown;
    description?: unknown;
    organization_id?: unknown;
    team_id?: unknown;
    team_role?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json(
      { message: "Project name is required.", field: "name" },
      { status: 422 },
    );
  }
  if (name.length > 255) {
    return NextResponse.json(
      { message: "Name must be 255 characters or fewer.", field: "name" },
      { status: 422 },
    );
  }

  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const organization_id =
    typeof body.organization_id === "string" && body.organization_id.trim()
      ? body.organization_id.trim()
      : undefined;
  const team_id =
    typeof body.team_id === "string" && body.team_id.trim()
      ? body.team_id.trim()
      : undefined;
  const team_role =
    typeof body.team_role === "string" &&
    TEAM_ASSIGNABLE_ROLES.includes(body.team_role as (typeof TEAM_ASSIGNABLE_ROLES)[number])
      ? body.team_role
      : undefined;

  const payload: Record<string, string> = { name };
  if (description) payload.description = description;
  if (organization_id) payload.organization_id = organization_id;
  if (team_id) payload.team_id = team_id;
  if (team_id && team_role) payload.team_role = team_role;

  try {
    const result = await serverApi.post<{ message: string; data: ProjectSummary }>(
      "/projects/create-project/",
      { token: accessToken, json: payload },
    );
    return NextResponse.json(result.data, { status: 201 });
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
