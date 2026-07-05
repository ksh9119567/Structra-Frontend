import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAccessToken } from "@/lib/auth/tokens";
import { serverApi } from "@/lib/api/server-client";
import { requireUser } from "@/lib/auth/session";
import { TeamDetailShell } from "@/features/teams/components/team-detail-shell";
import type { TeamSummary } from "@/lib/teams/types";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const accessToken = await getAccessToken();
  if (!accessToken) return { title: "Team" };

  try {
    const result = await serverApi.get<{ message: string; data: TeamSummary }>(
      `/teams/get-team-details/?team_id=${id}`,
      { token: accessToken },
    );
    return {
      title: result.data.name,
      description: result.data.description
        ? result.data.description
        : `Manage ${result.data.name} on Structra.`,
    };
  } catch {
    return { title: "Team" };
  }
}

export default async function TeamDetailPage({ params }: Props) {
  const { id } = await params;
  const [accessToken, user] = await Promise.all([getAccessToken(), requireUser()]);

  if (!accessToken) notFound();

  let team: TeamSummary;
  try {
    const result = await serverApi.get<{ message: string; data: TeamSummary }>(
      `/teams/get-team-details/?team_id=${id}`,
      { token: accessToken },
    );
    team = result.data;
  } catch {
    notFound();
  }

  return <TeamDetailShell team={team} currentUserEmail={user.email} />;
}
