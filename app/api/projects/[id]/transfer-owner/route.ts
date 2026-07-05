import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/tokens";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * BFF: Transfer project ownership to another member.
 * PUT /api/projects/[id]/transfer-owner
 * Body: { email: string }
 * Proxies to DRF PUT /api/v1/projects/transfer-owner/?project_id=<id>
 * Body to DRF: { email }
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) {
    return NextResponse.json(
      { message: "New owner email is required.", field: "email" },
      { status: 422 },
    );
  }

  try {
    const result = await serverApi.put<{ message: string }>(
      `/projects/transfer-owner/?project_id=${id}`,
      { token: accessToken, json: { email } },
    );
    return NextResponse.json({ message: result.message });
  } catch (error) {
    if (error instanceof ApiError) {
      const msg = error.message.toLowerCase();

      if (error.status === 404 || msg.includes("not found")) {
        return NextResponse.json(
          { message: "User not found in this project.", field: "email" },
          { status: 404 },
        );
      }
      if (error.status === 403) {
        return NextResponse.json(
          { message: "Only the current owner can transfer ownership." },
          { status: 403 },
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
