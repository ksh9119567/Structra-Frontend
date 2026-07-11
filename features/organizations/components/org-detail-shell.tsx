"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Building2,
  ChevronRight,
  LayoutDashboard,
  Users,
  FolderKanban,
  Shield,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { OrganizationSummary, OrgMembership, OrgRole } from "@/lib/organizations/types";
import { OrgOverviewTab } from "./org-overview-tab";
import { OrgMembersTab } from "./org-members-tab";
import { OrgTeamsTab } from "./org-teams-tab";
import { OrgProjectsTab } from "./org-projects-tab";
import { OrgSettingsTab } from "./org-settings-tab";
import { InviteMemberModal } from "./invite-member-modal";
import { ChangeRoleModal } from "./change-role-modal";
import { TransferOwnershipModal } from "./transfer-ownership-modal";

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabKey = "overview" | "members" | "teams" | "projects" | "settings";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "overview",  label: "Overview",  icon: LayoutDashboard },
  { key: "members",   label: "Members",   icon: Users },
  { key: "teams",     label: "Teams",     icon: Users },
  { key: "projects",  label: "Projects",  icon: FolderKanban },
  { key: "settings",  label: "Settings",  icon: Settings },
];

// ─── Props ────────────────────────────────────────────────────────────────────

type OrgDetailShellProps = {
  org: OrganizationSummary;
  currentUserEmail: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function OrgDetailShell({ org, currentUserEmail }: OrgDetailShellProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = (searchParams.get("tab") as TabKey) ?? "overview";
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [changeRoleTarget, setChangeRoleTarget] = React.useState<OrgMembership | null>(null);
  const [transferTarget, setTransferTarget] = React.useState<OrgMembership | null>(null);

  // ── Role resolution — shell-level, independent of which tab is active ──────
  // The organization owner is known authoritatively from the org record, so the
  // settings/teams/projects tabs no longer show "read-only" until the Members
  // tab is visited. For non-owners we resolve the precise role from membership.
  const isOwnerByRecord = org.owner_email === currentUserEmail;
  const [currentUserRole, setCurrentUserRole] = React.useState<OrgRole>(
    isOwnerByRecord ? "OWNER" : "VIEWER",
  );

  // When the settings tab is opened from the overview "Delete organization"
  // button, this asks it to auto-open the delete confirmation.
  const [settingsAction, setSettingsAction] = React.useState<"delete" | null>(null);

  React.useEffect(() => {
    if (isOwnerByRecord) {
      setCurrentUserRole("OWNER");
      return;
    }
    let cancelled = false;
    async function resolveRole() {
      try {
        const res = await fetch(`/api/organizations/${org.id}/members?page_size=100`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const members: OrgMembership[] = data.results?.data ?? [];
        const match = members.find((m) => m.user_email === currentUserEmail);
        if (!cancelled && match) setCurrentUserRole(match.role);
      } catch {
        // fail open — VIEWER (read-only) is the safe default
      }
    }
    resolveRole();
    return () => { cancelled = true; };
  }, [org.id, currentUserEmail, isOwnerByRecord]);

  function setTab(tab: TabKey) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function goToSettings(action?: "delete") {
    setSettingsAction(action ?? null);
    setTab("settings");
  }

  const initial = org.name.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-full flex-col">
      {/* ── Page header ── */}
      <div className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 py-3 text-xs text-muted-foreground">
            <Link
              href="/organizations"
              prefetch={false}
              className="hover:text-foreground transition-colors"
            >
              Organizations
            </Link>
            <ChevronRight className="size-3 shrink-0" />
            <span className="text-foreground font-medium truncate max-w-[200px]">
              {org.name}
            </span>
          </nav>

          {/* Org identity */}
          <div className="flex items-center gap-4 pb-5 pt-1">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-xl font-bold text-primary">
              {initial}
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-foreground truncate">
                {org.name}
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Owner: {org.owner_email}
              </p>
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
          <OrgOverviewTab
            org={org}
            currentUserEmail={currentUserEmail}
            onInvite={() => setInviteOpen(true)}
            onCreateTeam={() => setTab("teams")}
            onCreateProject={() => setTab("projects")}
            onRename={() => goToSettings()}
            onDelete={() => goToSettings("delete")}
          />
        )}
        {activeTab === "members" && (
          <OrgMembersTab
            org={org}
            currentUserEmail={currentUserEmail}
            onInvite={() => setInviteOpen(true)}
            onChangeRole={(member) => setChangeRoleTarget(member)}
            onTransferOwnership={(member) => setTransferTarget(member)}
            onCurrentUserRoleResolved={setCurrentUserRole}
          />
        )}
        {activeTab === "teams" && (
          <OrgTeamsTab org={org} currentUserRole={currentUserRole} />
        )}
        {activeTab === "projects" && (
          <OrgProjectsTab org={org} currentUserRole={currentUserRole} />
        )}
        {activeTab === "settings" && (
          <OrgSettingsTab
            org={org}
            currentUserRole={currentUserRole}
            initialAction={settingsAction}
            onInitialActionConsumed={() => setSettingsAction(null)}
          />
        )}
      </div>

      {/* ── Modals ── */}
      <InviteMemberModal
        open={inviteOpen}
        orgId={org.id}
        orgName={org.name}
        onClose={() => setInviteOpen(false)}
      />
      <ChangeRoleModal
        open={changeRoleTarget !== null}
        orgId={org.id}
        member={changeRoleTarget}
        currentUserRole={currentUserRole}
        onClose={() => setChangeRoleTarget(null)}
      />
      <TransferOwnershipModal
        open={transferTarget !== null}
        orgId={org.id}
        orgName={org.name}
        member={transferTarget}
        currentOwnerEmail={currentUserEmail}
        onClose={() => setTransferTarget(null)}
      />
    </div>
  );
}
