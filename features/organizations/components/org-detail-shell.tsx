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
import { OrgSettingsTab } from "./org-settings-tab";
import { InviteMemberModal } from "./invite-member-modal";
import { ChangeRoleModal } from "./change-role-modal";
import { TransferOwnershipModal } from "./transfer-ownership-modal";
import { ComingSoon } from "@/features/shell/components/coming-soon";

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
  const [currentUserRole, setCurrentUserRole] = React.useState<OrgRole>("VIEWER");

  function setTab(tab: TabKey) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
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
          <ComingSoon
            title="Teams"
            description="View and manage all teams within this organization."
            icon={Users}
          />
        )}
        {activeTab === "projects" && (
          <ComingSoon
            title="Projects"
            description="View all projects belonging to this organization."
            icon={FolderKanban}
          />
        )}
        {activeTab === "settings" && (
          <OrgSettingsTab
            org={org}
            currentUserRole={currentUserRole}
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
