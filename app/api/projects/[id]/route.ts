import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/tokens";
import { ALL_PROJECT_STATUSES, type ProjectSummary, type ProjectStatus } from "@/lib/projects/types";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * BFF: Get a single project's details.
 * GET /api/projects/[id]
 * Proxies to DRF GET /api/v1/projects/get-project-details/?project_id=<id>
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await serverApi.get<{ message: string; data: ProjectSummary }>(
      `/projects/get-project-details/?project_id=${id}`,
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
 * BFF: Update a project's name, description, and/or status.
 * PUT /api/projects/[id]
 * Body: { name?: string; description?: string; status?: ProjectStatus }
 * Proxies to DRF PUT /api/v1/projects/update-project/ body: { project_id, name?, description?, status? }
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  let body: { name?: unknown; description?: unknown; status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const payload: Record<string, string> = { project_id: id };

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json(
        { message: "Project name cannot be empty.", field: "name" },
        { status: 422 },
      );
    }
    payload.name = name;
  }

  if (typeof body.description === "string") {
    payload.description = body.description.trim();
  }

  if (typeof body.status === "string") {
    if (!ALL_PROJECT_STATUSES.includes(body.status as ProjectStatus)) {
      return NextResponse.json(
        { message: "Invalid project status.", field: "status" },
        { status: 422 },
      );
    }
    payload.status = body.status;
  }

  try {
    const result = await serverApi.put<{ message: string; data: ProjectSummary }>(
      "/projects/update-project/",
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
 * BFF: Delete (soft-delete) a project.
 * DELETE /api/projects/[id]
 * Proxies to DRF DELETE /api/v1/projects/delete-project/ body: { project_id }
 */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await serverApi.delete("/projects/delete-project/", {
      token: accessToken,
      json: { project_id: id },
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
