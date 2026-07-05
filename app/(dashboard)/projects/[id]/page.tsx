import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAccessToken } from "@/lib/auth/tokens";
import { serverApi } from "@/lib/api/server-client";
import { requireUser } from "@/lib/auth/session";
import { ProjectDetailShell } from "@/features/projects/components/project-detail-shell";
import type { ProjectSummary } from "@/lib/projects/types";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const accessToken = await getAccessToken();
  if (!accessToken) return { title: "Project" };

  try {
    const result = await serverApi.get<{ message: string; data: ProjectSummary }>(
      `/projects/get-project-details/?project_id=${id}`,
      { token: accessToken },
    );
    return {
      title: result.data.name,
      description: result.data.description
        ? result.data.description
        : `Manage ${result.data.name} on Structra.`,
    };
  } catch {
    return { title: "Project" };
  }
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const [accessToken, user] = await Promise.all([getAccessToken(), requireUser()]);

  if (!accessToken) notFound();

  let project: ProjectSummary;
  try {
    const result = await serverApi.get<{ message: string; data: ProjectSummary }>(
      `/projects/get-project-details/?project_id=${id}`,
      { token: accessToken },
    );
    project = result.data;
  } catch {
    notFound();
  }

  return <ProjectDetailShell project={project} currentUserEmail={user.email} />;
}
