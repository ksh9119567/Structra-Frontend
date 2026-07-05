"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Building2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { NOTIFICATIONS } from "@/config/shell-data";
import type { AuthUser } from "@/lib/auth/types";
import { LOGIN_PATH } from "@/lib/auth/config";

type AppTopbarProps = {
  user: AuthUser;
  onMenuToggle: () => void;
};

export function AppTopbar({ user, onMenuToggle }: AppTopbarProps) {
  const router = useRouter();
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);

  const unread = NOTIFICATIONS.filter((n) => !n.read).length;

  const displayName =
    user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.username;

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // best-effort
    }
    router.push(LOGIN_PATH);
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        aria-label="Toggle sidebar"
        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
      >
        <Menu className="size-4" />
      </button>

      {/* Org placeholder — will be replaced when orgs API is wired */}
      <div className="flex h-8 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground">
        <Building2 className="size-3.5 text-muted-foreground" />
        <span className="max-w-[140px] truncate text-muted-foreground">
          My Workspace
        </span>
      </div>

      {/* Search */}
      <div className="relative hidden flex-1 max-w-sm sm:flex">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search…"
          className="h-8 w-full rounded-md border border-border bg-card pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline-flex">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-1">
        {/* Notifications */}
        <div className="relative" data-dropdown>
          <button
            onClick={() => {
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
            aria-label="Notifications"
            className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Bell className="size-4" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full z-50 mt-1.5 w-80 rounded-lg border border-border bg-popover shadow-lg">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-sm font-semibold">Notifications</span>
                {unread > 0 && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {unread} new
                  </span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {NOTIFICATIONS.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "flex gap-3 border-b border-border/50 px-4 py-3 last:border-0",
                      !n.read && "bg-primary/5",
                    )}
                  >
                    <NotifIcon kind={n.kind} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground">
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {n.description}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                ))}
              </div>
              <div className="border-t border-border px-4 py-2.5">
                <button className="text-xs font-medium text-primary hover:underline">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" data-dropdown>
          <button
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            aria-label="User menu"
            className="flex h-8 items-center gap-2 rounded-md px-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {user.profile_picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profile_picture}
                alt={displayName}
                className="size-6 rounded-full object-cover"
              />
            ) : (
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                {initials}
              </span>
            )}
            <span className="hidden max-w-[100px] truncate sm:block">
              {displayName}
            </span>
            <ChevronDown
              className={cn(
                "size-3.5 text-muted-foreground transition-transform",
                profileOpen && "rotate-180",
              )}
            />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-lg border border-border bg-popover p-1 shadow-lg">
              {/* User info */}
              <div className="px-3 py-2.5">
                <p className="text-sm font-semibold text-foreground">
                  {displayName}
                </p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                {user.is_email_verified ? (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                    ✓ Verified
                  </span>
                ) : (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning">
                    Email unverified
                  </span>
                )}
              </div>
              <div className="my-1 h-px bg-border" />
              <ProfileMenuLink href="/profile" icon={User} label="Profile" onClick={() => setProfileOpen(false)} />
              <ProfileMenuLink href="/settings" icon={Settings} label="Settings" onClick={() => setProfileOpen(false)} />
              <div className="my-1 h-px bg-border" />
              <ProfileMenuItem
                icon={LogOut}
                label={signingOut ? "Signing out…" : "Sign out"}
                destructive
                disabled={signingOut}
                onClick={handleSignOut}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function NotifIcon({ kind }: { kind: string }) {
  const map: Record<string, { bg: string; text: string; char: string }> = {
    approval: { bg: "bg-warning/15", text: "text-warning", char: "✓" },
    mention: { bg: "bg-info/15", text: "text-info", char: "@" },
    task: { bg: "bg-primary/15", text: "text-primary", char: "T" },
    system: { bg: "bg-muted", text: "text-muted-foreground", char: "i" },
  };
  const s = map[kind] ?? map.system;
  return (
    <span
      className={cn(
        "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
        s.bg,
        s.text,
      )}
    >
      {s.char}
    </span>
  );
}

function ProfileMenuLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm text-foreground transition-colors hover:bg-accent"
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}

function ProfileMenuItem({
  icon: Icon,
  label,
  destructive,
  disabled,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  destructive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent disabled:opacity-50",
        destructive
          ? "text-destructive hover:text-destructive"
          : "text-foreground",
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}
