"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

// ─── Stat Card ────────────────────────────────────────────────────────────────

type StatCardProps = {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bg: string;
  /** Optional secondary line, only rendered in the "column" layout. */
  description?: string;
  /**
   * "row" — icon to the left, value/label stacked to the right (dashboard summary cards).
   * "column" — icon above value/label/description (overview-tab stat cards).
   * Defaults to "row".
   */
  layout?: "row" | "column";
};

export function StatCard({ label, value, icon: Icon, color, bg, description, layout = "row" }: StatCardProps) {
  if (layout === "column") {
    return (
      <div className="flex flex-col rounded-xl border border-border bg-card p-4">
        <span className={cn("mb-3 flex size-8 items-center justify-center rounded-lg", bg)}>
          <Icon className={cn("size-4", color)} />
        </span>
        <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
        <p className="mt-0.5 text-xs font-medium text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-card/80">
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", bg)}>
        <Icon className={cn("size-5", color)} />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

/** Loading placeholder matching the "row" layout's dimensions. */
export function StatCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <span className="size-10 shrink-0 animate-pulse rounded-lg bg-muted" />
      <div className="min-w-0 flex-1">
        <div className="h-6 w-12 animate-pulse rounded bg-muted" />
        <div className="mt-1.5 h-3 w-16 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
