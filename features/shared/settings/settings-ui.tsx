"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Shared presentational primitives for entity settings tabs
 * (Team Settings, Project Settings, …). Extracted from the original
 * Team Settings implementation so new settings tabs can reuse the same
 * section layout, info rows, governance indicators, and loading/error
 * states without duplicating markup.
 */

// ─── Section shell ────────────────────────────────────────────────────────────

export function SettingsSection({
  icon: Icon, title, description, children,
}: {
  icon: React.ElementType; title: string; description: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-4 text-primary" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Rows ─────────────────────────────────────────────────────────────────────

export function SettingsRow({
  label, description, children,
}: {
  label: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function InfoRow({
  icon: Icon, label, value, truncate,
}: {
  icon: React.ElementType; label: string; value: string; truncate?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="w-24 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span
        className={cn("flex-1 text-xs font-medium text-foreground text-right", truncate && "truncate")}
        title={truncate ? value : undefined}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Governance indicators ──────────────────────────────────────────────────

/** A "<label>  min. <badge>" row — badge is caller-supplied (e.g. a role badge). */
export function RolePermRow({ label, badge }: { label: string; badge: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-3.5 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>min.</span>
        {badge}
      </div>
    </div>
  );
}

export function GovernanceRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-3.5 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <span className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
        enabled ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
      )}>
        <span className={cn("size-1.5 rounded-full", enabled ? "bg-success" : "bg-muted-foreground/50")} />
        {enabled ? "Enabled" : "Disabled"}
      </span>
    </div>
  );
}

export function InheritanceBadge({ enabled }: { enabled: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
      enabled ? "bg-info/15 text-info" : "bg-muted text-muted-foreground",
    )}>
      <span className={cn("size-1.5 rounded-full", enabled ? "bg-info" : "bg-muted-foreground/50")} />
      {enabled ? "Inheriting" : "Not inheriting"}
    </span>
  );
}

// ─── Banners ──────────────────────────────────────────────────────────────────

export function InlineBanner({ type, message }: { type: "success" | "error"; message: string }) {
  const styles = {
    success: "border-success/30 bg-success/10 text-success",
    error: "border-destructive/30 bg-destructive/10 text-destructive",
  };
  const Icon = type === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div className={cn("flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-sm", styles[type])}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// ─── Loading / error states ─────────────────────────────────────────────────

export function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 space-y-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <div className="size-8 rounded-lg bg-muted" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-24 rounded bg-muted" />
              <div className="h-3 w-40 rounded bg-muted" />
            </div>
          </div>
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-10 rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-14 text-center">
      <AlertCircle className="mb-3 size-7 text-destructive" />
      <p className="text-sm font-medium text-foreground">Failed to load settings</p>
      <p className="mt-1 text-xs text-muted-foreground">{message}</p>
      <button onClick={onRetry} className="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline underline-offset-4">
        <RefreshCw className="size-3" />
        Try again
      </button>
    </div>
  );
}
