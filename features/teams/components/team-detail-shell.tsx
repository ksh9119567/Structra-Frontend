"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Users,
  ChevronRight,
  LayoutDashboard,
  FolderKanban,
  Settings,
  Building2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { TeamSummary, TeamMembership, TeamRole } from "@/lib/teams/types";
import { TeamOverviewTab } from "./team-overview-tab";
import { ComingSoon } from "@/features/shell/components/coming-soon";

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabKey = "overview" | "members" | "projects" | "settings";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "overview",  label: "Overview",  icon: LayoutDashboard },
  { key: "members",   label: "Members",   icon: Users },
  { key: "projects",  label: "Projects",  icon: FolderKanban },
  { key: "settings",  label: "Settings",  icon: Settings },
];

// ─── Props ────────────────────────────────────────────────────────────────────

type TeamDetailShellProps = {
  team: TeamSummary;
  currentUserEmail: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function TeamDetailShell({ team, currentUserEmail }: TeamDetailShellProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = (searchParams.get("tab") as TabKey) ?? "overview";
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [currentUserRole, setCurrentUserRole] = React.useState<TeamRole>("VIEWER");

  function setTab(tab: TabKey) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const initial = team.name.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-full flex-col">
      {/* ── Page header ── */}
      <div className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 py-3 text-xs text-muted-foreground">
            <Link
              href="/teams"
              prefetch={false}
              className="hover:text-foreground transition-colors"
            >
              Teams
            </Link>
            {team.organization && team.organization_name && (
              <>
                <ChevronRight className="size-3 shrink-0" />
                <Link
                  href={`/organizations/${team.organization}`}
                  prefetch={false}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Building2 className="size-3 shrink-0" />
                  <span className="truncate max-w-[120px]">{team.organization_name}</span>
                </Link>
              </>
            )}
            <ChevronRight className="size-3 shrink-0" />
            <span className="text-foreground font-medium truncate max-w-[200px]">
              {team.name}
            </span>
          </nav>

          {/* Team identity */}
          <div className="flex items-center gap-4 pb-5 pt-1">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-info/15 text-xl font-bold text-info">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold tracking-tight text-foreground truncate">
                  {team.name}
                </h1>
                {/* Org badge inline with title */}
                {team.organization && team.organization_name && (
                  <Link
                    href={`/organizations/${team.organization}`}
                    prefetch={false}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
                  >
                    <Building2 className="size-3 shrink-0" />
                    <span className="truncate max-w-[120px]">{team.organization_name}</span>
                  </Link>
                )}
              </div>
              {team.description ? (
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                  {team.description}
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Owner: {team.created_by_email}
                </p>
              )}
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-0.5 overflow-x-auto scrollbar-none -mb-px">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setTab(tab.key)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 border-b-2 px-3 pb-3 pt-1 text-sm font-medium transition-colors",
                    isActive
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                  )}
                >
                  <Icon className="size-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1">
        {activeTab === "overview" && (
          <TeamOverviewTab
            team={team}
            currentUserEmail={currentUserEmail}
            onInvite={() => setInviteOpen(true)}
            onCreateProject={() => {}}
          />
        )}
        {activeTab === "members" && (
          <ComingSoon
            title="Members"
            description="Manage team members, roles, and invitations."
            icon={Users}
          />
        )}
        {activeTab === "projects" && (
          <ComingSoon
            title="Projects"
            description="View and manage all projects belonging to this team."
            icon={FolderKanban}
          />
        )}
        {activeTab === "settings" && (
          <ComingSoon
            title="Settings"
            description="Configure team governance, limits, and role permissions."
            icon={Settings}
          />
        )}
      </div>
    </div>
  );
}
