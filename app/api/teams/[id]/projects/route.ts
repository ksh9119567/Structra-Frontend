import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/tokens";
import type { ProjectSummary } from "@/lib/projects/types";
import type { PaginatedResponse } from "@/lib/organizations/types";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * BFF: List projects belonging to a team.
 * GET /api/teams/[id]/projects?search=&status=&ordering=&page=&page_size=
 * Proxies to DRF GET /api/v1/projects/get-team-projects/?team_id=<id>
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);

  const backendParams = new URLSearchParams({ team_id: id });

  const forwarded = ["search", "status", "ordering", "page", "page_size"];
  for (const key of forwarded) {
    const val = searchParams.get(key);
    if (val) backendParams.set(key, val);
  }

  try {
    const result = await serverApi.get<PaginatedResponse<ProjectSummary>>(
      `/projects/get-team-projects/?${backendParams.toString()}`,
      { token: accessToken },
    );
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
