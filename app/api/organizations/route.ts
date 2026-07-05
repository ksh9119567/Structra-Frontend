import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/tokens";
import type { OrganizationSummary, PaginatedResponse } from "@/lib/organizations/types";

/**
 * BFF: List organizations the current user belongs to.
 * GET /api/organizations?search=&ordering=
 * Proxies to DRF GET /api/v1/organizations/get-org/
 */
export async function GET(request: NextRequest) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const ordering = searchParams.get("ordering") ?? "-created_at";

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (ordering) params.set("ordering", ordering);

  const query = params.toString();
  const path = `/organizations/get-org/${query ? `?${query}` : ""}`;

  try {
    const result = await serverApi.get<PaginatedResponse<OrganizationSummary>>(path, {
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
 * BFF: Create a new organization.
 * POST /api/organizations
 * Body: { name: string }
 * Proxies to DRF POST /api/v1/organizations/create-org/
 */
export async function POST(request: NextRequest) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

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
  if (name.length > 255) {
    return NextResponse.json(
      { message: "Name must be 255 characters or fewer.", field: "name" },
      { status: 422 },
    );
  }

  try {
    const result = await serverApi.post<{ message: string; data: OrganizationSummary }>(
      "/organizations/create-org/",
      { token: accessToken, json: { name } },
    );
    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      // DRF returns 400 with { name: ["..."] } for duplicate names
      const isDuplicate =
        error.status === 400 &&
        error.message.toLowerCase().includes("already exists");
      if (isDuplicate) {
        return NextResponse.json(
          { message: "An organization with this name already exists.", field: "name" },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json({ message: "Unexpected error." }, { status: 500 });
  }
}
