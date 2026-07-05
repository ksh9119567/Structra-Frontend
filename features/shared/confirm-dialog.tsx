"use client";

/**
 * ConfirmDialog — reusable destructive-action confirmation dialog.
 *
 * Used for:
 *   - Remove member (org / team / project)
 *   - Delete team / organization / project
 *   - Governance actions requiring confirmation
 *
 * Wraps ShadCN AlertDialog so focus-trap, keyboard, and accessibility
 * are handled by Radix. The caller controls open state.
 *
 * Usage:
 *   <ConfirmDialog
 *     open={open}
 *     onOpenChange={setOpen}
 *     title="Remove member?"
 *     description="Alice will lose access to this team immediately."
 *     confirmLabel="Remove"
 *     variant="destructive"
 *     onConfirm={handleRemove}
 *   />
 */

import * as React from "react";
import { AlertTriangle, Trash2, UserMinus, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConfirmDialogVariant =
  | "destructive"   // red — delete, remove, revoke
  | "warning"       // amber — transfer, demote, irreversible but not delete
  | "default";      // primary — neutral confirmation

type ConfirmDialogIcon = "trash" | "user-minus" | "shield" | "warning" | "none";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  /** Dialog heading */
  title: string;
  /** Supporting text below the heading */
  description: React.ReactNode;
  /** Optional extra detail block (e.g. a highlighted name or consequence list) */
  detail?: React.ReactNode;

  /** Label for the confirm button. Defaults to "Confirm". */
  confirmLabel?: string;
  /** Label for the cancel button. Defaults to "Cancel". */
  cancelLabel?: string;

  /** Visual style of the confirm button. Defaults to "destructive". */
  variant?: ConfirmDialogVariant;

  /** Icon shown in the header accent block. Defaults to "trash" for destructive, "warning" otherwise. */
  icon?: ConfirmDialogIcon;

  /** Whether the confirm action is in progress (shows spinner, disables buttons). */
  loading?: boolean;

  /** Called when the user clicks the confirm button. */
  onConfirm: () => void;
};

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<ConfirmDialogIcon, React.ElementType | null> = {
  trash: Trash2,
  "user-minus": UserMinus,
  shield: ShieldAlert,
  warning: AlertTriangle,
  none: null,
};

// ─── Variant styles ───────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<
  ConfirmDialogVariant,
  { header: string; iconBg: string; iconColor: string; button: string }
> = {
  destructive: {
    header: "border-destructive/20 bg-destructive/5",
    iconBg: "bg-destructive/15",
    iconColor: "text-destructive",
    button:
      "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/50 border-transparent",
  },
  warning: {
    header: "border-warning/20 bg-warning/5",
    iconBg: "bg-warning/15",
    iconColor: "text-warning",
    button:
      "bg-warning text-white hover:bg-warning/90 focus-visible:ring-warning/50 border-transparent",
  },
  default: {
    header: "border-border bg-muted/30",
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
    button: "",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  detail,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "destructive",
  icon,
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  // Default icon based on variant
  const resolvedIcon: ConfirmDialogIcon =
    icon ?? (variant === "destructive" ? "trash" : variant === "warning" ? "warning" : "none");

  const styles = VARIANT_STYLES[variant];
  const IconComponent = ICON_MAP[resolvedIcon];

  function handleConfirm(e: React.MouseEvent) {
    // Prevent AlertDialogAction from closing the dialog automatically —
    // the caller controls close timing (e.g. after async completes).
    e.preventDefault();
    onConfirm();
  }

  return (
    <AlertDialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <AlertDialogContent className="gap-0 p-0 overflow-hidden">
        {/* ── Header ── */}
        <div
          className={cn(
            "flex items-center gap-3 border-b px-6 py-5",
            styles.header,
          )}
        >
          {IconComponent && (
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg",
                styles.iconBg,
              )}
            >
              <IconComponent className={cn("size-4", styles.iconColor)} />
            </span>
          )}
          <AlertDialogHeader className="gap-0.5">
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        {/* ── Detail block (optional) ── */}
        {detail && (
          <div className="px-6 py-4 text-sm text-foreground">{detail}</div>
        )}

        {/* ── Footer ── */}
        <AlertDialogFooter className={cn(!detail && "mt-0")}>
          <AlertDialogCancel disabled={loading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              "min-w-[100px] gap-1.5 transition-all",
              styles.button,
            )}
          >
            {loading ? (
              <>
                <Spinner />
                {confirmLabel}…
              </>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="size-3.5 animate-spin"
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
