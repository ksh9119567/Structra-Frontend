import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/tokens";
import type { TeamSummary } from "@/lib/teams/types";
import type { PaginatedResponse } from "@/lib/organizations/types";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * BFF: List teams belonging to an organization.
 * GET /api/organizations/[id]/teams?search=&ordering=&page=&page_size=
 * Proxies to DRF GET /api/v1/teams/get-org-teams/?org_id=<id>
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);

  const backendParams = new URLSearchParams({ org_id: id });

  const forwarded = ["search", "ordering", "page", "page_size"];
  for (const key of forwarded) {
    const val = searchParams.get(key);
    if (val) backendParams.set(key, val);
  }

  try {
    const result = await serverApi.get<PaginatedResponse<TeamSummary>>(
      `/teams/get-org-teams/?${backendParams.toString()}`,
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
