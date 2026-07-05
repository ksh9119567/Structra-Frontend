"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Users,
  ChevronRight,
  LayoutDashboard,
  ListTodo,
  Settings,
  Building2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ProjectStatusBadge } from "@/features/shared/project-status-badge";
import { ConfirmDialog } from "@/features/shared/confirm-dialog";
import { FormErrorBanner } from "@/features/shared/members/member-ui";
import type { ProjectSummary, ProjectRole, ProjectMembership } from "@/lib/projects/types";
import { ProjectOverviewTab } from "./project-overview-tab";
import { ProjectMembersTab } from "./project-members-tab";
import { ProjectTasksTab } from "@/features/tasks/components/project-tasks-tab";
import { ProjectSettingsTab } from "./project-settings-tab";
import { InviteProjectMemberModal } from "./invite-project-member-modal";
import { ChangeProjectRoleModal } from "./change-project-role-modal";
import { TransferProjectOwnershipModal } from "./transfer-project-ownership-modal";

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabKey = "overview" | "members" | "tasks" | "settings";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "members",  label: "Members",  icon: Users },
  { key: "tasks",    label: "Tasks",    icon: ListTodo },
  { key: "settings", label: "Settings", icon: Settings },
];

// ─── Props ────────────────────────────────────────────────────────────────────

type ProjectDetailShellProps = {
  project: ProjectSummary;
  currentUserEmail: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectDetailShell({ project, currentUserEmail }: ProjectDetailShellProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = (searchParams.get("tab") as TabKey) ?? "overview";

  // ── Role resolution — shell-level, independent of which tab is active ──────
  // Fetches the current user's membership on mount so every tab has the role
  // immediately, without requiring the Members tab to be visited first.
  const [currentUserRole, setCurrentUserRole] = React.useState<ProjectRole>("VIEWER");

  React.useEffect(() => {
    let cancelled = false;
    async function resolveRole() {
      try {
        const params = new URLSearchParams({
          search: currentUserEmail,
          page_size: "1",
        });
        const res = await fetch(`/api/projects/${project.id}/members?${params.toString()}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const members: { user_email: string; role: ProjectRole }[] =
          data.results?.data ?? [];
        const match = members.find((m) => m.user_email === currentUserEmail);
        if (!cancelled && match) {
          setCurrentUserRole(match.role);
        }
      } catch {
        // fail open — VIEWER is the safe default
      }
    }
    resolveRole();
    return () => { cancelled = true; };
  }, [project.id, currentUserEmail]);

  // ── Members tab modal state ─────────────────────────────────────────────────
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [changeRoleTarget, setChangeRoleTarget] = React.useState<ProjectMembership | null>(null);
  const [transferTarget, setTransferTarget] = React.useState<ProjectMembership | null>(null);
  const [removeTarget, setRemoveTarget] = React.useState<ProjectMembership | null>(null);
  const [removing, setRemoving] = React.useState(false);
  const [removeError, setRemoveError] = React.useState<string | null>(null);
  const [membersRefreshKey, setMembersRefreshKey] = React.useState(0);

  async function handleRemoveConfirm() {
    if (!removeTarget) return;
    setRemoving(true);
    setRemoveError(null);
    try {
      const res = await fetch(
        `/api/projects/${project.id}/members/${encodeURIComponent(removeTarget.user_email)}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) {
        setRemoveError(data.message ?? "Failed to remove member.");
        return;
      }
      setRemoveTarget(null);
      setMembersRefreshKey((k) => k + 1);
    } catch {
      setRemoveError("Network error. Please check your connection.");
    } finally {
      setRemoving(false);
    }
  }

  function setTab(tab: TabKey) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const initial = project.name.charAt(0).toUpperCase();
  const isArchived = project.status === "ARCHIVED";

  return (
    <div className="flex min-h-full flex-col">
      {/* ── Page header ── */}
      <div className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 py-3 text-xs text-muted-foreground">
            <Link href="/projects" prefetch={false} className="hover:text-foreground transition-colors">
              Projects
            </Link>
            {project.organization && project.organization_name && (
              <>
                <ChevronRight className="size-3 shrink-0" />
                <Link
                  href={`/organizations/${project.organization}`}
                  prefetch={false}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Building2 className="size-3 shrink-0" />
                  <span className="truncate max-w-[120px]">{project.organization_name}</span>
                </Link>
              </>
            )}
            {project.team && project.team_name && (
              <>
                <ChevronRight className="size-3 shrink-0" />
                <Link
                  href={`/teams/${project.team}`}
                  prefetch={false}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Users className="size-3 shrink-0" />
                  <span className="truncate max-w-[120px]">{project.team_name}</span>
                </Link>
              </>
            )}
            <ChevronRight className="size-3 shrink-0" />
            <span className="text-foreground font-medium truncate max-w-[200px]">{project.name}</span>
          </nav>

          {/* Project identity */}
          <div className="flex items-center gap-4 pb-5 pt-1">
            <span
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-xl text-xl font-bold",
                isArchived ? "bg-muted text-muted-foreground" : "bg-warning/15 text-warning",
              )}
            >
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  className={cn(
                    "text-xl font-semibold tracking-tight truncate",
                    isArchived ? "text-muted-foreground line-through" : "text-foreground",
                  )}
                >
                  {project.name}
                </h1>
                <ProjectStatusBadge status={project.status} />
                {project.organization && project.organization_name && (
                  <Link
                    href={`/organizations/${project.organization}`}
                    prefetch={false}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
                  >
                    <Building2 className="size-3 shrink-0" />
                    <span className="truncate max-w-[120px]">{project.organization_name}</span>
                  </Link>
                )}
                {project.team && project.team_name && (
                  <Link
                    href={`/teams/${project.team}`}
                    prefetch={false}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
                  >
                    <Users className="size-3 shrink-0" />
                    <span className="truncate max-w-[120px]">{project.team_name}</span>
                  </Link>
                )}
              </div>
              {project.description ? (
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{project.description}</p>
              ) : (
                <p className="mt-0.5 text-xs text-muted-foreground">Owner: {project.created_by_email}</p>
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
          <ProjectOverviewTab
            project={project}
            currentUserRole={currentUserRole}
            onOpenSettings={() => setTab("settings")}
            onOpenMembers={() => setTab("members")}
          />
        )}
        {activeTab === "members" && (
          <ProjectMembersTab
            project={project}
            currentUserEmail={currentUserEmail}
            onInvite={() => setInviteOpen(true)}
            onChangeRole={(member) => setChangeRoleTarget(member)}
            onTransferOwnership={(member) => setTransferTarget(member)}
            onRemoveMember={(member) => setRemoveTarget(member)}
            onCurrentUserRoleResolved={setCurrentUserRole}
            refreshKey={membersRefreshKey}
          />
        )}
        {activeTab === "tasks" && (
          <ProjectTasksTab project={project} currentUserRole={currentUserRole} />
        )}
        {activeTab === "settings" && (
          <ProjectSettingsTab
            project={project}
            currentUserRole={currentUserRole}
            onTransferOwnership={(member) => setTransferTarget(member)}
          />
        )}
      </div>

      {/* ── Modals ── */}
      <InviteProjectMemberModal
        open={inviteOpen}
        projectId={project.id}
        projectName={project.name}
        onClose={() => setInviteOpen(false)}
      />
      <ChangeProjectRoleModal
        open={changeRoleTarget !== null}
        projectId={project.id}
        member={changeRoleTarget}
        currentUserRole={currentUserRole}
        onClose={() => setChangeRoleTarget(null)}
        onRoleChanged={() => setMembersRefreshKey((k) => k + 1)}
      />
      <TransferProjectOwnershipModal
        open={transferTarget !== null}
        projectId={project.id}
        projectName={project.name}
        member={transferTarget}
        currentOwnerEmail={currentUserEmail}
        onClose={() => setTransferTarget(null)}
        onTransferred={() => {
          setCurrentUserRole("MANAGER");
          setMembersRefreshKey((k) => k + 1);
        }}
      />
      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(open) => { if (!open) { setRemoveTarget(null); setRemoveError(null); } }}
        title="Remove member?"
        description={
          <>
            <span className="font-medium text-foreground">{removeTarget?.user_email}</span>{" "}
            will lose access to this project immediately.
          </>
        }
        detail={removeError ? <FormErrorBanner message={removeError} /> : undefined}
        confirmLabel="Remove"
        variant="destructive"
        icon="user-minus"
        loading={removing}
        onConfirm={handleRemoveConfirm}
      />
    </div>
  );
}
