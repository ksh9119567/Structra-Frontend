import type { Metadata } from "next";
import { FolderKanban } from "lucide-react";
import { ComingSoon } from "@/features/shell/components/coming-soon";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <ComingSoon
      title="Projects"
      description="Plan, track, and deliver projects with full visibility across tasks, timelines, and team progress."
      icon={FolderKanban}
    />
  );
}
