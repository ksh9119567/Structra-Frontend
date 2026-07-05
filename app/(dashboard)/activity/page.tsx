import type { Metadata } from "next";
import { Activity } from "lucide-react";
import { ComingSoon } from "@/features/shell/components/coming-soon";

export const metadata: Metadata = { title: "Activity" };

export default function ActivityPage() {
  return (
    <ComingSoon
      title="Activity"
      description="A full audit log of everything happening across your workspace — tasks, approvals, team changes, and more."
      icon={Activity}
    />
  );
}
