import { NextRequest, NextResponse } from "next/server";

import { serverApi } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/tokens";

const DRF_PATH: Record<string, string> = {
  organization: "/organizations/accept-org-invite/",
  team: "/teams/accept-team-invite/",
  project: "/projects/accept-project-invite/",
};

/**
 * BFF: Accept an org/team/project invite.
 * POST /api/invites/accept
 * Body: { kind: "organization" | "team" | "project"; token: string }
 * Proxies to DRF POST /api/v1/{organizations|teams|projects}/accept-{...}-invite/?invite_token=<token>
 * DRF returns { message, data: <Membership> }.
 */
export async function POST(request: NextRequest) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  let body: { kind?: unknown; token?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const kind = typeof body.kind === "string" ? body.kind : "";
  const token = typeof body.token === "string" ? body.token.trim() : "";

  const drfPath = DRF_PATH[kind];
  if (!drfPath) {
    return NextResponse.json(
      { message: "Invalid invite kind.", field: "kind" },
      { status: 422 },
    );
  }
  if (!token) {
    return NextResponse.json(
      { message: "Invite token is required.", field: "token" },
      { status: 422 },
    );
  }

  try {
    const result = await serverApi.post<{ message: string; data: unknown }>(
      `${drfPath}?invite_token=${encodeURIComponent(token)}`,
      { token: accessToken },
    );
    return NextResponse.json({ message: result.message, data: result.data });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unexpected error." }, { status: 500 });
  }
}
