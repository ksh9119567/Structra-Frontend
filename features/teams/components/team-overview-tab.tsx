"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  FolderKanban,
  UserPlus,
  Plus,
  Activity,
  Crown,
  Building2,
  Calendar,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Pencil,
  Trash2,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { TeamSummary } from "@/lib/teams/types";
import type { ActivityLogEntry } from "@/lib/organizations/types";

// ─── Props ────────────────────────────────────────────────────────────────────

type TeamOverviewTabProps = {
  team: TeamSummary;
  currentUserEmail: string;
  onInvite?: () => void;
  onCreateProject?: () => void;
};

// ─── Activity fetch state ─────────────────────────────────────────────────────

type ActivityState =
  | { status: "loading" }
  | { status: "success"; entries: ActivityLogEntry[] }
  | { status: "error" };

// ─── Component ────────────────────────────────────────────────────────────────

export function TeamOverviewTab({
  team,
  currentUserEmail,
  onInvite,
  onCreateProject,
}: TeamOverviewTabProps) {
  const [activityState, setActivityState] = React.useState<ActivityState>({
    status: "loading",
  });

  const isOwner = team.created_by_email === currentUserEmail;

  React.useEffect(() => {
    let cancelled = false;

    async function fetchActivity() {
      setActivityState({ status: "loading" });
      try {
        const params = new URLSearchParams({
          resource_type: "Team",
          resource_id: team.id,
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
  }, [team.id]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* ── Left column (2/3) ── */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          <StatCards team={team} />
          <QuickActions
            team={team}
            isOwner={isOwner}
            onInvite={onInvite}
            onCreateProject={onCreateProject}
          />
          <ActivitySection state={activityState} teamId={team.id} />
        </div>

        {/* ── Right column (1/3) ── */}
        <div className="flex flex-col gap-5">
          <TeamSummaryCard team={team} isOwner={isOwner} />
        </div>
      </div>
    </div>
  );
}

// ─── Stat Cards ───────────────────────────────────────────────────────────────

function StatCards({ team }: { team: TeamSummary }) {
  const stats = [
    {
      label: "Members",
      value: team.member_count,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
      description: "Active members",
    },
    {
      label: "Projects",
      value: team.project_count,
      icon: FolderKanban,
      color: "text-warning",
      bg: "bg-warning/10",
      description: "Active projects",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
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

function QuickActions({
  team,
  isOwner,
  onInvite,
  onCreateProject,
}: {
  team: TeamSummary;
  isOwner: boolean;
  onInvite?: () => void;
  onCreateProject?: () => void;
}) {
  const actions = [
    {
      label: "Invite Member",
      description: "Add someone to this team",
      icon: UserPlus,
      color: "text-primary",
      bg: "bg-primary/10",
      onClick: onInvite ?? (() => {}),
      href: undefined as string | undefined,
    },
    {
      label: "Create Project",
      description: "Start a new project for this team",
      icon: FolderKanban,
      color: "text-warning",
      bg: "bg-warning/10",
      onClick: onCreateProject ?? (() => {}),
      href: undefined as string | undefined,
    },
    ...(team.organization
      ? [
          {
            label: "Open Organization",
            description: team.organization_name ?? "View parent organization",
            icon: Building2,
            color: "text-info",
            bg: "bg-info/10",
            onClick: () => {},
            href: `/organizations/${team.organization}`,
          },
        ]
      : []),
  ];

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
        <p className="text-xs text-muted-foreground">Common tasks for this team</p>
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
  teamId,
}: {
  state: ActivityState;
  teamId: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
          <p className="text-xs text-muted-foreground">Latest actions in this team</p>
        </div>
        <Activity className="size-4 text-muted-foreground" />
      </div>

      {state.status === "loading" && <ActivitySkeleton />}

      {state.status === "error" && (
        <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
          <Activity className="size-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Activity tracking is not yet available for this team.
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
        <Link
          href="/activity"
          prefetch={false}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline underline-offset-4"
        >
          View full activity log
          <ArrowRight className="size-3" />
        </Link>
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

// ─── Team Summary Card ────────────────────────────────────────────────────────

function TeamSummaryCard({
  team,
  isOwner,
}: {
  team: TeamSummary;
  isOwner: boolean;
}) {
  const initial = team.name.charAt(0).toUpperCase();

  const createdDate = new Date(team.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">Team</h2>
      </div>

      {/* Avatar + name */}
      <div className="flex flex-col items-center px-5 py-6 text-center">
        <span className="mb-3 flex size-16 items-center justify-center rounded-2xl bg-info/15 text-2xl font-bold text-info">
          {initial}
        </span>
        <p className="text-base font-semibold text-foreground">{team.name}</p>
        {isOwner && (
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
            <Crown className="size-2.5" />
            You own this
          </span>
        )}
        {team.description && (
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed text-center">
            {team.description}
          </p>
        )}
      </div>

      {/* Details list */}
      <div className="divide-y divide-border/60 border-t border-border">
        {/* Organization */}
        {team.organization ? (
          <div className="flex items-center gap-3 px-5 py-3">
            <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="w-16 shrink-0 text-xs text-muted-foreground">Org</span>
            <Link
              href={`/organizations/${team.organization}`}
              prefetch={false}
              className="flex-1 truncate text-right text-xs font-medium text-primary hover:underline underline-offset-4"
              title={team.organization_name ?? undefined}
            >
              {team.organization_name ?? "View org"}
            </Link>
          </div>
        ) : (
          <DetailRow
            icon={Building2}
            label="Org"
            value="Standalone"
          />
        )}

        <DetailRow
          icon={Crown}
          label="Owner"
          value={team.created_by_email}
          truncate
        />
        <DetailRow
          icon={Users}
          label="Created by"
          value={team.created_by_email}
          truncate
        />
        <DetailRow
          icon={Calendar}
          label="Created"
          value={createdDate}
        />
        <DetailRow
          icon={Users}
          label="Members"
          value={String(team.member_count)}
        />
        <DetailRow
          icon={FolderKanban}
          label="Projects"
          value={String(team.project_count)}
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
