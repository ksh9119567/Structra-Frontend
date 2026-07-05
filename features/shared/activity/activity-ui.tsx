"use client";

/**
 * Shared "Recent Activity" UI — used by the org/team/project overview tabs
 * and the dashboard's workspace-wide activity feed.
 */

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { ActivityLogEntry } from "@/lib/organizations/types";

// ─── Fetch state ──────────────────────────────────────────────────────────────

export type ActivityState =
  | { status: "loading" }
  | { status: "success"; entries: ActivityLogEntry[] }
  | { status: "error" };

// ─── Action metadata ──────────────────────────────────────────────────────────

export const ACTION_META: Record<
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

// ─── Time formatting ──────────────────────────────────────────────────────────

export function formatTimeAgo(iso: string): string {
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

// ─── Activity row ─────────────────────────────────────────────────────────────

export function ActivityRow({ entry }: { entry: ActivityLogEntry }) {
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

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

// ─── Section ──────────────────────────────────────────────────────────────────

type ActivitySectionProps = {
  state: ActivityState;
  /** Subtitle shown under the "Recent Activity" heading. */
  subtitle: string;
  /** Message shown when state is "error". */
  errorMessage: string;
  /** Message shown when state is "success" with zero entries. */
  emptyMessage?: string;
  /** When provided, renders a "Try again" action in the error state. */
  onRetry?: () => void;
};

export function ActivitySection({
  state,
  subtitle,
  errorMessage,
  emptyMessage = "No activity recorded yet.",
  onRetry,
}: ActivitySectionProps) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Activity className="size-4 text-muted-foreground" />
      </div>

      {state.status === "loading" && <ActivitySkeleton />}

      {state.status === "error" && (
        <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
          <Activity className="size-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">{errorMessage}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs font-medium text-primary hover:underline underline-offset-4"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {state.status === "success" && state.entries.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
          <Activity className="size-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">{emptyMessage}</p>
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
