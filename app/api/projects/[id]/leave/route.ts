import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/tokens";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * BFF: Leave a project (self-remove).
 * DELETE /api/projects/[id]/leave
 * Proxies to DRF DELETE /api/v1/projects/self-remove-member/?project_id=<id>
 * The backend blocks this for the project owner (must transfer ownership
 * first) and for team-derived-only participants (nothing explicit to leave -
 * they should leave the team instead).
 */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await serverApi.delete(`/projects/self-remove-member/?project_id=${id}`, {
      token: accessToken,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unexpected error." }, { status: 500 });
  }
}
