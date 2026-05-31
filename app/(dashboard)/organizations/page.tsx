import type { Metadata } from "next";

import { OrganizationsView } from "@/features/organizations/components/organizations-view";

export const metadata: Metadata = {
  title: "Organizations",
  description: "Manage your organizations on Structra.",
};

export default function OrganizationsPage() {
  return <OrganizationsView />;
}
