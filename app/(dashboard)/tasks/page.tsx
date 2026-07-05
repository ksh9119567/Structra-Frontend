import type { Metadata } from "next";

import { TasksView } from "@/features/tasks/components/tasks-view";

export const metadata: Metadata = {
  title: "Tasks",
  description: "View and manage tasks assigned to you across all your projects.",
};

export default function TasksPage() {
  return <TasksView />;
}
