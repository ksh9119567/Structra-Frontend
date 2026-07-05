import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/tokens";
import {
  ALL_TASK_STATUSES,
  ALL_TASK_PRIORITIES,
  ALL_TASK_TYPES,
  type TaskSummary,
  type TaskStatus,
  type TaskPriority,
  type TaskType,
} from "@/lib/tasks/types";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * BFF: Get a single task's details.
 * GET /api/tasks/[id]
 * Proxies to DRF GET /api/v1/tasks/get_task_details/?task_id=<id>
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await serverApi.get<{ message: string; data: TaskSummary }>(
      `/tasks/get_task_details/?task_id=${id}`,
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
 * BFF: Update a task.
 * PUT /api/tasks/[id]
 * Body: partial<{ title, description, start_date, due_date, status, priority, task_type, assigned_to }>
 * Proxies to DRF PUT /api/v1/tasks/update-task/?task_id=<id>
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  const passthroughFields = ["description", "start_date", "due_date", "assigned_to"];

  if ("title" in body) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json(
        { message: "Title cannot be empty.", field: "title" },
        { status: 422 },
      );
    }
    payload.title = title;
  }

  if (typeof body.status === "string") {
    if (!ALL_TASK_STATUSES.includes(body.status as TaskStatus)) {
      return NextResponse.json(
        { message: "Invalid task status.", field: "status" },
        { status: 422 },
      );
    }
    payload.status = body.status;
  }

  if (typeof body.priority === "string") {
    if (!ALL_TASK_PRIORITIES.includes(body.priority as TaskPriority)) {
      return NextResponse.json(
        { message: "Invalid task priority.", field: "priority" },
        { status: 422 },
      );
    }
    payload.priority = body.priority;
  }

  if (typeof body.task_type === "string") {
    if (!ALL_TASK_TYPES.includes(body.task_type as TaskType)) {
      return NextResponse.json(
        { message: "Invalid task type.", field: "task_type" },
        { status: 422 },
      );
    }
    payload.task_type = body.task_type;
  }

  for (const field of passthroughFields) {
    if (field in body) {
      payload[field] = field === "description" && typeof body[field] === "string"
        ? (body[field] as string).trim()
        : body[field];
    }
  }

  try {
    const result = await serverApi.put<{ message: string; data: TaskSummary }>(
      `/tasks/update-task/?task_id=${id}`,
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
 * BFF: Delete (soft-delete) a task.
 * DELETE /api/tasks/[id]
 * Proxies to DRF DELETE /api/v1/tasks/delete-task/?task_id=<id>
 */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await serverApi.delete(`/tasks/delete-task/?task_id=${id}`, { token: accessToken });
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
