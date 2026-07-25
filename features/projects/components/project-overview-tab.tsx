"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  Settings,
  Activity,
  Crown,
  Building2,
  Calendar,
  CheckCircle2,
  PauseCircle,
  Archive,
  ExternalLink,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ActivitySection, type ActivityState } from "@/features/shared/activity/activity-ui";
import type { ActivityLogEntry } from "@/lib/organizations/types";
import type { ProjectSummary, ProjectRole, ProjectStatus } from "@/lib/projects/types";
import { PROJECT_STATUS_META } from "@/lib/projects/types";
import { ProjectRoleBadge } from "./project-role-badge";

// ─── Props ────────────────────────────────────────────────────────────────────

type ProjectOverviewTabProps = {
  project: ProjectSummary;
  currentUserRole: ProjectRole;
  onOpenSettings?: () => void;
  onOpenMembers?: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectOverviewTab({
  project,
  currentUserRole,
  onOpenSettings,
  onOpenMembers,
}: ProjectOverviewTabProps) {
  const [activityState, setActivityState] = React.useState<ActivityState>({
    status: "loading",
  });

  const isOwner = currentUserRole === "OWNER";

  React.useEffect(() => {
    let cancelled = false;

    async function fetchActivity() {
      setActivityState({ status: "loading" });
      try {
        const params = new URLSearchParams({
          resource_type: "Project",
          resource_id: project.id,
          ordering: "-timestamp",
        });
        const res = await fetch(`/api/activity?${params.toString()}`);
        if (!res.ok || cancelled) {
          if (!cancelled) setActivityState({ status: "error" });
          return;
        }
        const data = await res.json();
        const entries: ActivityLogEntry[] = data.results ?? data.data ?? [];
        if (!cancelled)
          setActivityState({ status: "success", entries: entries.slice(0, 8) });
      } catch {
        if (!cancelled) setActivityState({ status: "error" });
      }
    }

    fetchActivity();
    return () => {
      cancelled = true;
    };
  }, [project.id]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* ── Left column (2/3) ── */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          <StatCards project={project} />
          <QuickActions
            project={project}
            onOpenSettings={onOpenSettings}
            onOpenMembers={onOpenMembers}
          />
          <ActivitySection
            state={activityState}
            subtitle="Latest actions in this project"
            errorMessage="Activity tracking is not yet available for this project."
          />
        </div>

        {/* ── Right column (1/3) ── */}
        <div className="flex flex-col gap-5">
          <ProjectSummaryCard project={project} isOwner={isOwner} />
        </div>
      </div>
    </div>
  );
}

// ─── Stat Cards ───────────────────────────────────────────────────────────────

const STATUS_ICONS: Record<ProjectStatus, React.ElementType> = {
  PLANNING: Calendar,
  ACTIVE: Activity,
  COMPLETED: CheckCircle2,
  ON_HOLD: PauseCircle,
  ARCHIVED: Archive,
};

function StatCards({ project }: { project: ProjectSummary }) {
  const statusMeta = PROJECT_STATUS_META[project.status];
  const StatusIcon = STATUS_ICONS[project.status];

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <Users className="size-4 text-primary" />
          </span>
        </div>
        <p className="text-2xl font-bold tabular-nums text-foreground">
          {project.member_count}
        </p>
        <p className="mt-0.5 text-xs font-medium text-foreground">Members</p>
        <p className="text-[11px] text-muted-foreground">Active members</p>
      </div>

      <div className="flex flex-col rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg",
              statusMeta.className,
            )}
          >
            <StatusIcon className="size-4" />
          </span>
        </div>
        <p className="text-2xl font-bold text-foreground">{statusMeta.label}</p>
        <p className="mt-0.5 text-xs font-medium text-foreground">Status</p>
        <p className="text-[11px] text-muted-foreground">Current project status</p>
      </div>
    </div>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

function QuickActions({
  project,
  onOpenSettings,
  onOpenMembers,
}: {
  project: ProjectSummary;
  onOpenSettings?: () => void;
  onOpenMembers?: () => void;
}) {
  const actions = [
    {
      label: "Members",
      description: "View and manage project members",
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
      onClick: onOpenMembers ?? (() => {}),
      href: undefined as string | undefined,
    },
    {
      label: "Settings",
      description: "Configure permissions and governance",
      icon: Settings,
      color: "text-muted-foreground",
      bg: "bg-muted",
      onClick: onOpenSettings ?? (() => {}),
      href: undefined as string | undefined,
    },
    ...(project.team && project.team_name
      ? [
          {
            label: "Open Team",
            description: project.team_name,
            icon: Users,
            color: "text-info",
            bg: "bg-info/10",
            onClick: () => {},
            href: `/teams/${project.team}`,
          },
        ]
      : project.organization && project.organization_name
        ? [
            {
              label: "Open Organization",
              description: project.organization_name,
              icon: Building2,
              color: "text-info",
              bg: "bg-info/10",
              onClick: () => {},
              href: `/organizations/${project.organization}`,
            },
          ]
        : []),
  ];

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
        <p className="text-xs text-muted-foreground">Common tasks for this project</p>
      </div>
      <div
        className={cn(
          "grid grid-cols-1 gap-0 divide-y divide-border/60",
          actions.length === 3
            ? "sm:grid-cols-3 sm:divide-x sm:divide-y-0"
            : "sm:grid-cols-2 sm:divide-x sm:divide-y-0",
        )}
      >
        {actions.map((action) => {
          const Icon = action.icon;
          const inner = (
            <>
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105",
                  action.bg,
                )}
              >
                <Icon className={cn("size-4", action.color)} />
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1 text-sm font-medium text-foreground">
                  {action.label}
                  {action.href && (
                    <ExternalLink className="size-3 text-muted-foreground" />
                  )}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {action.description}
                </p>
              </div>
            </>
          );

          const baseClass =
            "group flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 first:rounded-bl-xl last:rounded-br-xl sm:first:rounded-bl-xl sm:last:rounded-br-xl";

          return action.href ? (
            <Link
              key={action.label}
              href={action.href}
              prefetch={false}
              className={baseClass}
            >
              {inner}
            </Link>
          ) : (
            <button
              key={action.label}
              onClick={action.onClick}
              className={baseClass}
            >
              {inner}
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ─── Project Summary Card ──────────────────────────────────────────────────────

function ProjectSummaryCard({
  project,
  isOwner,
}: {
  project: ProjectSummary;
  isOwner: boolean;
}) {
  const initial = project.name.charAt(0).toUpperCase();
  const isArchived = project.status === "ARCHIVED";

  const createdDate = new Date(project.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">Project</h2>
      </div>

      {/* Avatar + name */}
      <div className="flex flex-col items-center px-5 py-6 text-center">
        <span
          className={cn(
            "mb-3 flex size-16 items-center justify-center rounded-2xl text-2xl font-bold",
            isArchived ? "bg-muted text-muted-foreground" : "bg-warning/15 text-warning",
          )}
        >
          {initial}
        </span>
        <p className="text-base font-semibold text-foreground">{project.name}</p>
        {isOwner && (
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
            <Crown className="size-2.5" />
            You own this
          </span>
        )}
        {project.description && (
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed text-center">
            {project.description}
          </p>
        )}
      </div>

      {/* Details list */}
      <div className="divide-y divide-border/60 border-t border-border">
        {project.organization && project.organization_name ? (
          <div className="flex items-center gap-3 px-5 py-3">
            <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="w-16 shrink-0 text-xs text-muted-foreground">Org</span>
            <Link
              href={`/organizations/${project.organization}`}
              prefetch={false}
              className="flex-1 truncate text-right text-xs font-medium text-primary hover:underline underline-offset-4"
              title={project.organization_name}
            >
              {project.organization_name}
            </Link>
          </div>
        ) : null}

        {project.team && project.team_name ? (
          <div className="flex items-center gap-3 px-5 py-3">
            <Users className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="w-16 shrink-0 text-xs text-muted-foreground">Team</span>
            <div className="flex flex-1 items-center justify-end gap-1.5 min-w-0">
              <Link
                href={`/teams/${project.team}`}
                prefetch={false}
                className="truncate text-right text-xs font-medium text-primary hover:underline underline-offset-4"
                title={project.team_name}
              >
                {project.team_name}
              </Link>
              {project.team_role && <ProjectRoleBadge role={project.team_role} />}
            </div>
          </div>
        ) : null}

        {!project.organization && !project.team && (
          <DetailRow icon={Building2} label="Context" value="Personal" />
        )}

        <DetailRow
          icon={Crown}
          label="Owner"
          value={project.created_by_email}
          truncate
        />
        <DetailRow icon={Calendar} label="Created" value={createdDate} />
        <DetailRow icon={Users} label="Members" value={String(project.member_count)} />
        <DetailRow
          icon={STATUS_ICONS[project.status]}
          label="Status"
          value={PROJECT_STATUS_META[project.status].label}
        />
      </div>
    </section>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  truncate,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="w-16 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "flex-1 text-xs font-medium text-foreground text-right",
          truncate && "truncate",
        )}
        title={truncate ? value : undefined}
      >
        {value}
      </span>
    </div>
  );
}
