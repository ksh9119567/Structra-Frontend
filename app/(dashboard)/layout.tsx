import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { LOGIN_PATH } from "@/lib/auth/config";
import { getAccessToken } from "@/lib/auth/tokens";
import { getCurrentUser } from "@/lib/auth/session";
import { AppShell } from "@/features/shell/components/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fast-path: if no cookie at all, redirect immediately without hitting backend.
  const accessToken = await getAccessToken();
  if (!accessToken) redirect(LOGIN_PATH);

  // Skip the backend call on Next.js prefetch requests.
  // Prefetches only render the layout to check for redirects — they don't need
  // real user data, and hitting the backend on every prefetch causes the
  // repeated GET /dashboard (or /organizations, etc.) log spam.
  const headerStore = await headers();
  const isPrefetch =
    headerStore.get("next-router-prefetch") === "1" ||
    headerStore.get("purpose") === "prefetch";

  if (isPrefetch) {
    // Return a minimal shell with no user data — prefetch renders are discarded anyway.
    return <>{children}</>;
  }

  // Real navigation: validate token and fetch user from backend.
  // getCurrentUser is React-cached, so layout + page share one HTTP call.
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_PATH);

  return <AppShell user={user}>{children}</AppShell>;
}
