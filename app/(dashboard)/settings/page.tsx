import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/session";
import { SettingsView } from "@/features/settings/components/settings-view";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your Structra account settings.",
};

export default async function SettingsPage() {
  const user = await requireUser();
  return <SettingsView user={user} />;
}
