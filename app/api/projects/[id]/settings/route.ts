import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/tokens";
import type { ProjectSettings } from "@/lib/projects/types";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * BFF: Get project governance settings.
 * GET /api/projects/[id]/settings
 * Proxies to DRF GET /api/v1/governance/get-project-settings/?project_id=<id>
 * Restricted to the project OWNER (and org owner) by the backend.
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await serverApi.get<{ message: string; data: ProjectSettings }>(
      `/governance/get-project-settings/?project_id=${id}`,
      { token: accessToken },
    );
    return NextResponse.json(result.data);
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
