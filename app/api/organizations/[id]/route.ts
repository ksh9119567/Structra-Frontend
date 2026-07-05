import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/tokens";
import type { OrganizationSummary } from "@/lib/organizations/types";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * BFF: Get a single organization's details.
 * GET /api/organizations/[id]
 * Proxies to DRF GET /api/v1/organizations/get-org-details/?org_id=<id>
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await serverApi.get<{ message: string; data: OrganizationSummary }>(
      `/organizations/get-org-details/?org_id=${id}`,
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
 * BFF: Update an organization's name.
 * PUT /api/organizations/[id]
 * Body: { name: string }
 * Proxies to DRF PUT /api/v1/organizations/update-org/?org_id=<id>
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  let body: { name?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json(
      { message: "Organization name is required.", field: "name" },
      { status: 422 },
    );
  }

  try {
    const result = await serverApi.put<{ message: string; data: OrganizationSummary }>(
      `/organizations/update-org/?org_id=${id}`,
      { token: accessToken, json: { name } },
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
 * BFF: Delete an organization.
 * DELETE /api/organizations/[id]
 * Proxies to DRF DELETE /api/v1/organizations/delete-org/?org_id=<id>
 */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await serverApi.delete(`/organizations/delete-org/?org_id=${id}`, {
      token: accessToken,
    });
    return NextResponse.json({ success: true });
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
