import { redirect } from "next/navigation";

import { isAuthenticated } from "@/lib/auth/tokens";
import { DASHBOARD_PATH } from "@/lib/auth/config";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Already signed in? Skip the auth screens.
  if (await isAuthenticated()) {
    redirect(DASHBOARD_PATH);
  }

  return <div className="flex min-h-dvh flex-col bg-background">{children}</div>;
}
