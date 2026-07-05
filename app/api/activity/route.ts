import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/tokens";
import type { ActivityLogEntry, PaginatedResponse } from "@/lib/organizations/types";

/**
 * BFF: Fetch activity logs.
 * GET /api/activity?resource_type=&resource_id=&ordering=&page_size=
 * Proxies to DRF GET /api/v1/activity-logs/
 */
export async function GET(request: NextRequest) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  // Forward all query params to the backend
  const allowed = ["resource_type", "resource_id", "action", "ordering", "page", "page_size", "search"];
  const params = new URLSearchParams();
  for (const key of allowed) {
    const val = searchParams.get(key);
    if (val) params.set(key, val);
  }
  // Default to 20 items for overview panels
  if (!params.has("page_size")) params.set("page_size", "20");

  const query = params.toString();
  const path = `/activity-logs/${query ? `?${query}` : ""}`;

  try {
    const result = await serverApi.get<PaginatedResponse<ActivityLogEntry>>(path, {
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
