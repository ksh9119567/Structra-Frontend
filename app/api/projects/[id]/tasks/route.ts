import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/tokens";
import type { TaskSummary } from "@/lib/tasks/types";
import type { PaginatedResponse } from "@/lib/organizations/types";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * BFF: List tasks for a project.
 * GET /api/projects/[id]/tasks?search=&status=&priority=&ordering=&page=&page_size=
 * Proxies to DRF GET /api/v1/tasks/get-project-tasks/?project_id=<id>
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);

  const backendParams = new URLSearchParams({ project_id: id });

  const forwarded = ["search", "status", "priority", "ordering", "page", "page_size"];
  for (const key of forwarded) {
    const val = searchParams.get(key);
    if (val) backendParams.set(key, val);
  }

  try {
    const result = await serverApi.get<PaginatedResponse<TaskSummary>>(
      `/tasks/get-project-tasks/?${backendParams.toString()}`,
      { token: accessToken },
    );
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
 * BFF: Create a task in a project.
 * POST /api/projects/[id]/tasks
 * Body: { title: string; description?: string }
 * Proxies to DRF POST /api/v1/tasks/create-task/
 * Body to DRF: { title, description, project_id }
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  let body: { title?: unknown; description?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";

  if (!title) {
    return NextResponse.json(
      { message: "Title is required.", field: "title" },
      { status: 422 },
    );
  }

  try {
    const result = await serverApi.post<{ message: string; data: TaskSummary }>(
      `/tasks/create-task/`,
      { token: accessToken, json: { title, description, project_id: id } },
    );
    return NextResponse.json({ message: result.message, data: result.data }, { status: 201 });
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
