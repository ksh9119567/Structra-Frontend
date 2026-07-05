import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/tokens";
import type { TaskSummary } from "@/lib/tasks/types";
import type { PaginatedResponse } from "@/lib/organizations/types";

/**
 * BFF: List tasks assigned to the current user, across all projects.
 * GET /api/tasks?search=&status=&priority=&project=&parent=&ordering=&page=&page_size=
 * Proxies to DRF GET /api/v1/tasks/get-my-tasks/
 */
export async function GET(request: NextRequest) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const backendParams = new URLSearchParams();

  const forwarded = ["search", "status", "priority", "project", "parent", "ordering", "page", "page_size"];
  for (const key of forwarded) {
    const val = searchParams.get(key);
    if (val) backendParams.set(key, val);
  }

  const query = backendParams.toString();

  try {
    const result = await serverApi.get<PaginatedResponse<TaskSummary>>(
      `/tasks/get-my-tasks/${query ? `?${query}` : ""}`,
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
 * BFF: Create a task.
 * POST /api/tasks
 * Body: { title: string; description?: string; project_id: string; parent_id?: string }
 * Proxies to DRF POST /api/v1/tasks/create-task/
 */
export async function POST(request: NextRequest) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  let body: { title?: unknown; description?: unknown; project_id?: unknown; parent_id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json(
      { message: "Title is required.", field: "title" },
      { status: 422 },
    );
  }

  const projectId = typeof body.project_id === "string" ? body.project_id.trim() : "";
  if (!projectId) {
    return NextResponse.json(
      { message: "Project is required.", field: "project_id" },
      { status: 422 },
    );
  }

  const description = typeof body.description === "string" ? body.description.trim() : "";

  const payload: Record<string, string> = { title, description, project_id: projectId };
  if (typeof body.parent_id === "string" && body.parent_id.trim()) {
    payload.parent_id = body.parent_id.trim();
  }

  try {
    const result = await serverApi.post<{ message: string; data: TaskSummary }>(
      `/tasks/create-task/`,
      { token: accessToken, json: payload },
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
