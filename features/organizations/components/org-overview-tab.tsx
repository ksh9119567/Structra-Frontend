"use client";

import * as React from "react";
import {
  Users,
  FolderKanban,
  UserPlus,
  Plus,
  Activity,
  Crown,
  Mail,
  Calendar,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Pencil,
  Trash2,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { OrganizationSummary, ActivityLogEntry } from "@/lib/organizations/types";

// ─── Props ────────────────────────────────────────────────────────────────────

type OrgOverviewTabProps = {
  org: OrganizationSummary;
  currentUserEmail: string;
  onInvite?: () => void;
};

// ─── Activity fetch state ─────────────────────────────────────────────────────

type ActivityState =
  | { status: "loading" }
  | { status: "success"; entries: ActivityLogEntry[] }
  | { status: "error" };

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
          <ActivitySection state={activityState} orgId={org.id} />
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
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className="flex flex-col rounded-xl border border-border bg-card p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg",
                  s.bg,
                )}
              >
                <Icon className={cn("size-4", s.color)} />
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-foreground">
              {s.value}
            </p>
            <p className="mt-0.5 text-xs font-medium text-foreground">{s.label}</p>
            <p className="text-[11px] text-muted-foreground">{s.description}</p>
          </div>
        );
      })}
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

// ─── Activity Section ─────────────────────────────────────────────────────────

const ACTION_META: Record<
  string,
  { color: string; bg: string; icon: React.ElementType }
> = {
  CREATE: { color: "text-success",          bg: "bg-success/10",     icon: Plus },
  UPDATE: { color: "text-info",             bg: "bg-info/10",        icon: Pencil },
  DELETE: { color: "text-destructive",      bg: "bg-destructive/10", icon: Trash2 },
  LOGIN:  { color: "text-primary",          bg: "bg-primary/10",     icon: CheckCircle2 },
  LOGOUT: { color: "text-muted-foreground", bg: "bg-muted",          icon: ArrowRight },
  ACCESS: { color: "text-muted-foreground", bg: "bg-muted",          icon: ShieldCheck },
  FAILED: { color: "text-destructive",      bg: "bg-destructive/10", icon: AlertCircle },
  READ:   { color: "text-muted-foreground", bg: "bg-muted",          icon: Activity },
};

function ActivitySection({
  state,
  orgId,
}: {
  state: ActivityState;
  orgId: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
          <p className="text-xs text-muted-foreground">
            Latest actions in this organization
          </p>
        </div>
        <Activity className="size-4 text-muted-foreground" />
      </div>

      {state.status === "loading" && <ActivitySkeleton />}

      {state.status === "error" && (
        <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
          <AlertCircle className="size-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Could not load activity. It may not be available yet.
          </p>
        </div>
      )}

      {state.status === "success" && state.entries.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
          <Activity className="size-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">No activity recorded yet.</p>
        </div>
      )}

      {state.status === "success" && state.entries.length > 0 && (
        <div className="divide-y divide-border/50">
          {state.entries.map((entry) => (
            <ActivityRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      <div className="border-t border-border px-5 py-3">
        <button className="flex items-center gap-1 text-xs font-medium text-primary hover:underline underline-offset-4">
          View full activity log
          <ArrowRight className="size-3" />
        </button>
      </div>
    </section>
  );
}

function ActivityRow({ entry }: { entry: ActivityLogEntry }) {
  const meta = ACTION_META[entry.action] ?? ACTION_META.READ;
  const Icon = meta.icon;

  const timeAgo = formatTimeAgo(entry.timestamp);

  return (
    <div className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-accent/40">
      <span
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
          meta.bg,
        )}
      >
        <Icon className={cn("size-3.5", meta.color)} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground leading-snug">
          {entry.description || `${entry.action} · ${entry.resource_type}`}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {entry.user_email ?? entry.username} · {timeAgo}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
          meta.bg,
          meta.color,
        )}
      >
        {entry.action}
      </span>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="divide-y divide-border/50">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-5 py-3.5 animate-pulse">
          <div className="mt-0.5 size-7 shrink-0 rounded-lg bg-muted" />
          <div className="flex-1 space-y-1.5 pt-0.5">
            <div className="h-3 w-3/4 rounded bg-muted" />
            <div className="h-2.5 w-1/3 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
