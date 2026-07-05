import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { DASHBOARD_PATH } from "@/lib/auth/config";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Only redirect to dashboard if the token is actually valid on the backend.
  // getCurrentUser returns null for missing/expired tokens (and clears stale cookies).
  const user = await getCurrentUser();
  if (user) redirect(DASHBOARD_PATH);

  return <div className="flex min-h-dvh flex-col bg-background">{children}</div>;
}
