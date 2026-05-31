import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAccessToken } from "@/lib/auth/tokens";
import { serverApi } from "@/lib/api/server-client";
import { requireUser } from "@/lib/auth/session";
import { OrgDetailShell } from "@/features/organizations/components/org-detail-shell";
import type { OrganizationSummary } from "@/lib/organizations/types";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const accessToken = await getAccessToken();
  if (!accessToken) return { title: "Organization" };

  try {
    const result = await serverApi.get<{ message: string; data: OrganizationSummary }>(
      `/organizations/get-org-details/?org_id=${id}`,
      { token: accessToken },
    );
    return {
      title: result.data.name,
      description: `Manage ${result.data.name} on Structra.`,
    };
  } catch {
    return { title: "Organization" };
  }
}

export default async function OrgDetailPage({ params }: Props) {
  const { id } = await params;
  const [accessToken, user] = await Promise.all([getAccessToken(), requireUser()]);

  if (!accessToken) notFound();

  let org: OrganizationSummary;
  try {
    const result = await serverApi.get<{ message: string; data: OrganizationSummary }>(
      `/organizations/get-org-details/?org_id=${id}`,
      { token: accessToken },
    );
    org = result.data;
  } catch {
    notFound();
  }

  return <OrgDetailShell org={org} currentUserEmail={user.email} />;
}
