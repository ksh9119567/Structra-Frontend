import type { Metadata } from "next";

import { TeamsView } from "@/features/teams/components/teams-view";

export const metadata: Metadata = {
  title: "Teams",
  description: "Manage your teams on Structra.",
};

export default function TeamsPage() {
  return <TeamsView />;
}
