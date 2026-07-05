import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/session";
import { ProfileView } from "@/features/profile/components/profile-view";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your Structra profile.",
};

export default async function ProfilePage() {
  const user = await requireUser();
  return <ProfileView user={user} />;
}
