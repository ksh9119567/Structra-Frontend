import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/tokens";
import type { TeamSummary } from "@/lib/teams/types";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * BFF: Get a single team's details.
 * GET /api/teams/[id]
 * Proxies to DRF GET /api/v1/teams/get-team-details/?team_id=<id>
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await serverApi.get<{ message: string; data: TeamSummary }>(
      `/teams/get-team-details/?team_id=${id}`,
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
 * BFF: Update a team's name and/or description.
 * PUT /api/teams/[id]
 * Body: { name?: string; description?: string }
 * Proxies to DRF PUT /api/v1/teams/update-team/ body: { team_id, name?, description? }
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  let body: { name?: unknown; description?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const payload: Record<string, string> = { team_id: id };

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json(
        { message: "Team name cannot be empty.", field: "name" },
        { status: 422 },
      );
    }
    payload.name = name;
  }

  if (typeof body.description === "string") {
    payload.description = body.description.trim();
  }

  try {
    const result = await serverApi.put<{ message: string; data: TeamSummary }>(
      "/teams/update-team/",
      { token: accessToken, json: payload },
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
 * BFF: Delete a team.
 * DELETE /api/teams/[id]
 * Proxies to DRF DELETE /api/v1/teams/delete-team/ body: { team_id }
 */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await serverApi.delete("/teams/delete-team/", {
      token: accessToken,
      json: { team_id: id },
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
