import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/tokens";
import type { OrgSettings } from "@/lib/organizations/types";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * BFF: Get organization governance settings.
 * GET /api/organizations/[id]/settings
 * Proxies to DRF GET /api/v1/governance/get-org-settings/?org_id=<id>
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await serverApi.get<{ message: string; data: OrgSettings }>(
      `/governance/get-org-settings/?org_id=${id}`,
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

/**
 * BFF: Update organization governance settings.
 * PUT /api/organizations/[id]/settings
 * Body: Partial<OrgSettings>
 * Proxies to DRF PUT /api/v1/governance/update-org-settings/?org_id=<id>
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  try {
    const result = await serverApi.put<{ message: string; data: OrgSettings }>(
      `/governance/update-org-settings/?org_id=${id}`,
      { token: accessToken, json: body },
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
