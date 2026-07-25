import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/tokens";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * BFF: Leave an organization (self-remove).
 * DELETE /api/organizations/[id]/leave
 * Proxies to DRF DELETE /api/v1/organizations/self-remove-member/?org_id=<id>
 * The backend blocks this for the org owner (must transfer ownership first).
 */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await serverApi.delete(`/organizations/self-remove-member/?org_id=${id}`, {
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
