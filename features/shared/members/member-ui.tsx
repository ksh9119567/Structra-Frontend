"use client";

/**
 * Shared membership UI primitives.
 * Used by org, team, and (future) project member components.
 * Zero business logic — pure presentational building blocks.
 */

import * as React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Spinner ──────────────────────────────────────────────────────────────────

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-4 animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─── Check icon (used inside role option cards) ───────────────────────────────

export function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" className="size-2.5 text-primary-foreground" fill="none">
      <path
        d="M2 6l3 3 5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Member avatar initials ───────────────────────────────────────────────────

export function getMemberInitials(email: string): string {
  return email.split("@")[0].slice(0, 2).toUpperCase();
}

// ─── Member identity card ─────────────────────────────────────────────────────
// Used inside ChangeRoleModal to show who is being acted on.

type MemberIdentityCardProps = {
  email: string;
  joinedAt: string;
  /** The badge rendered for the current role (pass <OrgRoleBadge> or <TeamRoleBadge>) */
  currentRoleBadge: React.ReactNode;
  /** Optional: badge for the newly selected role, shown with an arrow */
  nextRoleBadge?: React.ReactNode;
};

export function MemberIdentityCard({
  email,
  joinedAt,
  currentRoleBadge,
  nextRoleBadge,
}: MemberIdentityCardProps) {
  const initials = getMemberInitials(email);
  const joinedDate = new Date(joinedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{email}</p>
        <p className="text-xs text-muted-foreground">Joined {joinedDate}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {currentRoleBadge}
        {nextRoleBadge && (
          <>
            <svg
              viewBox="0 0 16 16"
              className="size-3.5 text-muted-foreground"
              fill="none"
              aria-hidden
            >
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {nextRoleBadge}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Role option card ─────────────────────────────────────────────────────────
// Used in InviteMemberModal (compact 2-col grid) and ChangeRoleModal (full-width list).

type RoleOptionCardProps = {
  /** The badge node to render (OrgRoleBadge or TeamRoleBadge) */
  badge: React.ReactNode;
  description: string;
  /** Expandable permission list — shown when selected */
  permissions?: string[];
  selected: boolean;
  isCurrent?: boolean;
  disabled: boolean;
  /** compact = 2-col grid style (invite modal); full = full-width list (change role modal) */
  variant?: "compact" | "full";
  onSelect: () => void;
};

export function RoleOptionCard({
  badge,
  description,
  permissions,
  selected,
  isCurrent,
  disabled,
  variant = "compact",
  onSelect,
}: RoleOptionCardProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect()}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "group text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "compact"
          ? "flex flex-col items-start rounded-lg border p-3"
          : "w-full rounded-lg border p-3.5",
        selected
          ? "border-primary bg-primary/8 ring-1 ring-primary/30"
          : "border-border bg-background hover:border-border/80 hover:bg-accent/40",
      )}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {badge}
            {isCurrent && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                current
              </span>
            )}
          </div>
          <p className={cn("leading-snug text-muted-foreground", variant === "compact" ? "mt-1.5 text-[11px]" : "mt-1 text-xs")}>
            {description}
          </p>
          {/* Permission list — shown when selected in full variant */}
          {variant === "full" && selected && permissions && permissions.length > 0 && (
            <ul className="mt-2.5 space-y-1">
              {permissions.map((p) => (
                <li key={p} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary/60" />
                  {p}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Selection indicator */}
        {variant === "compact" ? (
          selected && (
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary">
              <CheckIcon />
            </span>
          )
        ) : (
          <span
            className={cn(
              "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
              selected
                ? "border-primary bg-primary"
                : "border-border bg-background group-hover:border-primary/50",
            )}
          >
            {selected && <CheckIcon />}
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Permission warning banner ────────────────────────────────────────────────

type PermissionWarningBannerProps = {
  type: "downgrade" | "upgrade";
  message: string;
};

export function PermissionWarningBanner({ type, message }: PermissionWarningBannerProps) {
  const isDowngrade = type === "downgrade";
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-xs",
        isDowngrade
          ? "border-warning/30 bg-warning/8 text-warning"
          : "border-info/30 bg-info/8 text-info",
      )}
    >
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
      <div>
        <p className="font-semibold">
          {isDowngrade ? "Permission reduction" : "Permission expansion"}
        </p>
        <p className="mt-0.5 opacity-90">{message}</p>
      </div>
    </div>
  );
}

// ─── Consequence item (transfer ownership modal) ──────────────────────────────

export function ConsequenceItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-warning/20 bg-warning/8 px-3.5 py-2.5">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
      <p className="text-xs text-warning leading-snug">{text}</p>
    </div>
  );
}

// ─── Modal success view ───────────────────────────────────────────────────────
// Generic success screen used by invite, change-role, and transfer modals.

type ModalSuccessViewProps = {
  title: string;
  description: React.ReactNode;
  detail?: React.ReactNode;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
};

export function ModalSuccessView({
  title,
  description,
  detail,
  primaryLabel = "Done",
  secondaryLabel,
  onPrimary,
  onSecondary,
}: ModalSuccessViewProps) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-success/15">
        <CheckCircle2 className="size-7 text-success" />
      </span>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <div className="mt-1.5 max-w-xs text-sm text-muted-foreground">{description}</div>
      {detail && <div className="mt-4">{detail}</div>}
      <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        {secondaryLabel && onSecondary && (
          <button
            onClick={onSecondary}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {secondaryLabel}
          </button>
        )}
        <button
          onClick={onPrimary}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Error banner (form-level) ────────────────────────────────────────────────

export function FormErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
    >
      <svg className="mt-0.5 size-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span>{message}</span>
    </div>
  );
}
