import type { Metadata } from "next";
import { SquareCheckBig } from "lucide-react";
import { ComingSoon } from "@/features/shell/components/coming-soon";

export const metadata: Metadata = { title: "Tasks" };

export default function TasksPage() {
  return (
    <ComingSoon
      title="Tasks"
      description="View and manage all tasks assigned to you and your team — filter by status, priority, and due date."
      icon={SquareCheckBig}
    />
  );
}
