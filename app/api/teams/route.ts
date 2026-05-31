import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/tokens";
import type { TeamSummary } from "@/lib/teams/types";
import type { PaginatedResponse } from "@/lib/organizations/types";

/**
 * BFF: List teams the current user belongs to.
 * GET /api/teams?search=&ordering=
 * Proxies to DRF GET /api/v1/teams/get-user-teams/
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
  const path = `/teams/get-user-teams/${query ? `?${query}` : ""}`;

  try {
    const result = await serverApi.get<PaginatedResponse<TeamSummary>>(path, {
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
 * BFF: Create a new team.
 * POST /api/teams
 * Body: { name: string; description?: string; organization_id?: string }
 * Proxies to DRF POST /api/v1/teams/create-team/
 */
export async function POST(request: NextRequest) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  let body: { name?: unknown; description?: unknown; organization_id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json(
      { message: "Team name is required.", field: "name" },
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

  const payload: Record<string, string> = { name };
  if (description) payload.description = description;
  if (organization_id) payload.organization_id = organization_id;

  try {
    const result = await serverApi.post<{ message: string; data: TeamSummary }>(
      "/teams/create-team/",
      { token: accessToken, json: payload },
    );
    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      const isDuplicate =
        error.status === 400 &&
        error.message.toLowerCase().includes("already exists");
      if (isDuplicate) {
        return NextResponse.json(
          { message: "A team with this name already exists.", field: "name" },
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
