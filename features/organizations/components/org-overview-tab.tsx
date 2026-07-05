"use client";

import * as React from "react";
import {
  Users,
  FolderKanban,
  UserPlus,
  Crown,
  Mail,
  Calendar,
  RefreshCw,
  Pencil,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/features/shared/stat-card";
import { ActivitySection, type ActivityState } from "@/features/shared/activity/activity-ui";
import type { OrganizationSummary, ActivityLogEntry } from "@/lib/organizations/types";

// ─── Props ────────────────────────────────────────────────────────────────────

type OrgOverviewTabProps = {
  org: OrganizationSummary;
  currentUserEmail: string;
  onInvite?: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function OrgOverviewTab({ org, currentUserEmail, onInvite }: OrgOverviewTabProps) {
  const [activityState, setActivityState] = React.useState<ActivityState>({
    status: "loading",
  });

  const isOwner = org.owner_email === currentUserEmail;

  // Fetch recent activity for this org's resource_id
  React.useEffect(() => {
    let cancelled = false;

    async function fetchActivity() {
      setActivityState({ status: "loading" });
      try {
        const params = new URLSearchParams({
          resource_type: "Organization",
          resource_id: org.id,
          ordering: "-timestamp",
        });
        const res = await fetch(`/api/activity?${params.toString()}`);
        if (!res.ok || cancelled) {
          if (!cancelled) setActivityState({ status: "error" });
          return;
        }
        const data = await res.json();
        const entries: ActivityLogEntry[] = data.results ?? data.data ?? [];
        if (!cancelled) setActivityState({ status: "success", entries: entries.slice(0, 8) });
      } catch {
        if (!cancelled) setActivityState({ status: "error" });
      }
    }

    fetchActivity();
    return () => { cancelled = true; };
  }, [org.id]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* ── Left column (2/3) ── */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          {/* Stat cards */}
          <StatCards org={org} />

          {/* Quick actions */}
          <QuickActions orgId={org.id} isOwner={isOwner} onInvite={onInvite} />

          {/* Activity feed */}
          <ActivitySection
            state={activityState}
            subtitle="Latest actions in this organization"
            errorMessage="Could not load activity. It may not be available yet."
          />
        </div>

        {/* ── Right column (1/3) ── */}
        <div className="flex flex-col gap-5">
          {/* Org summary card */}
          <OrgSummaryCard org={org} isOwner={isOwner} />
        </div>
      </div>
    </div>
  );
}

// ─── Stat Cards ───────────────────────────────────────────────────────────────

function StatCards({ org }: { org: OrganizationSummary }) {
  const stats = [
    {
      label: "Members",
      value: org.member_count,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
      description: "Active members",
    },
    {
      label: "Teams",
      value: org.team_count,
      icon: Users,
      color: "text-info",
      bg: "bg-info/10",
      description: "Active teams",
    },
    {
      label: "Projects",
      value: org.project_count,
      icon: FolderKanban,
      color: "text-warning",
      bg: "bg-warning/10",
      description: "Active projects",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <StatCard key={s.label} layout="column" {...s} />
      ))}
    </div>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

function QuickActions({ orgId, isOwner, onInvite }: { orgId: string; isOwner: boolean; onInvite?: () => void }) {
  const actions = [
    {
      label: "Invite Member",
      description: "Add someone to this organization",
      icon: UserPlus,
      color: "text-primary",
      bg: "bg-primary/10",
      onClick: onInvite ?? (() => {}),
    },
    {
      label: "Create Team",
      description: "Start a new team within this org",
      icon: Users,
      color: "text-info",
      bg: "bg-info/10",
      onClick: () => {},
    },
    {
      label: "Create Project",
      description: "Launch a new project",
      icon: FolderKanban,
      color: "text-warning",
      bg: "bg-warning/10",
      onClick: () => {},
    },
  ];

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
        <p className="text-xs text-muted-foreground">Common tasks for this organization</p>
      </div>
      <div className="grid grid-cols-1 gap-0 divide-y divide-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={action.onClick}
              className="group flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 first:rounded-bl-xl last:rounded-br-xl sm:first:rounded-bl-xl sm:last:rounded-br-xl"
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105",
                  action.bg,
                )}
              >
                <Icon className={cn("size-4", action.color)} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {action.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ─── Org Summary Card ─────────────────────────────────────────────────────────

function OrgSummaryCard({
  org,
  isOwner,
}: {
  org: OrganizationSummary;
  isOwner: boolean;
}) {
  const initial = org.name.charAt(0).toUpperCase();

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">Organization</h2>
      </div>

      {/* Avatar + name */}
      <div className="flex flex-col items-center px-5 py-6 text-center">
        <span className="mb-3 flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-2xl font-bold text-primary">
          {initial}
        </span>
        <p className="text-base font-semibold text-foreground">{org.name}</p>
        {isOwner && (
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
            <Crown className="size-2.5" />
            You own this
          </span>
        )}
      </div>

      {/* Details list */}
      <div className="divide-y divide-border/60 border-t border-border">
        <DetailRow
          icon={Crown}
          label="Owner"
          value={org.owner_email}
          truncate
        />
        <DetailRow
          icon={Users}
          label="Members"
          value={String(org.member_count)}
        />
        <DetailRow
          icon={Users}
          label="Teams"
          value={String(org.team_count)}
        />
        <DetailRow
          icon={FolderKanban}
          label="Projects"
          value={String(org.project_count)}
        />
      </div>

      {/* Actions */}
      {isOwner && (
        <div className="border-t border-border p-4 space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
          >
            <Pencil className="size-3.5" />
            Rename organization
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="w-full justify-start gap-2"
          >
            <Trash2 className="size-3.5" />
            Delete organization
          </Button>
        </div>
      )}
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
