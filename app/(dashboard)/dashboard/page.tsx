import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/session";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your Structra workspace overview.",
};

export default async function DashboardPage() {
  // requireUser is React-cached — shares the single get-user call made by the layout.
  const user = await requireUser();
  return <DashboardView user={user} />;
}
