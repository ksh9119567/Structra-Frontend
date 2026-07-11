"use client";

import * as React from "react";
import { Shield, AlertCircle, Save } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { OrgSettings, OrgRole } from "@/lib/organizations/types";

// ─── Editable field config ──────────────────────────────────────────────────

/** Boolean governance fields, grouped to mirror the read-only settings view. */
type BoolField = keyof Pick<
  OrgSettings,
  | "require_approval_for_invites"
  | "require_approval_for_updates"
  | "require_approval_for_removal"
  | "require_approval_for_team"
  | "require_approval_for_project"
  | "allow_team_creation"
  | "allow_project_creation"
  | "allow_member_invites"
  | "allow_member_updates"
  | "allow_member_removal"
  | "allow_self_removal"
>;

const GROUPS: { title: string; rows: { key: BoolField; label: string }[] }[] = [
  {
    title: "Approval rules",
    rows: [
      { key: "require_approval_for_invites", label: "Require approval for member invites" },
      { key: "require_approval_for_updates", label: "Require approval for member updates" },
      { key: "require_approval_for_removal", label: "Require approval for member removal" },
      { key: "require_approval_for_team", label: "Require approval for team creation" },
      { key: "require_approval_for_project", label: "Require approval for project creation" },
    ],
  },
  {
    title: "Creation controls",
    rows: [
      { key: "allow_team_creation", label: "Allow team creation by non-owners" },
      { key: "allow_project_creation", label: "Allow project creation by non-owners" },
    ],
  },
  {
    title: "Membership rules",
    rows: [
      { key: "allow_member_invites", label: "Allow members to invite others" },
      { key: "allow_member_updates", label: "Allow members to update others" },
      { key: "allow_member_removal", label: "Allow members to remove others" },
      { key: "allow_self_removal", label: "Allow members to leave the organization" },
    ],
  },
];

const DEFAULT_ROLE_OPTIONS: OrgRole[] = ["ADMIN", "MANAGER", "MEMBER", "VIEWER"];

// ─── Types ────────────────────────────────────────────────────────────────────

type Editable = Pick<OrgSettings, BoolField> & { default_member_role: OrgRole };

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "error"; message: string };

type GovernanceEditModalProps = {
  open: boolean;
  orgId: string;
  settings: OrgSettings;
  onClose: () => void;
  onSaved: (updated: OrgSettings) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

function toEditable(s: OrgSettings): Editable {
  return {
    require_approval_for_invites: s.require_approval_for_invites,
    require_approval_for_updates: s.require_approval_for_updates,
    require_approval_for_removal: s.require_approval_for_removal,
    require_approval_for_team: s.require_approval_for_team,
    require_approval_for_project: s.require_approval_for_project,
    allow_team_creation: s.allow_team_creation,
    allow_project_creation: s.allow_project_creation,
    allow_member_invites: s.allow_member_invites,
    allow_member_updates: s.allow_member_updates,
    allow_member_removal: s.allow_member_removal,
    allow_self_removal: s.allow_self_removal,
    default_member_role: s.default_member_role,
  };
}

export function GovernanceEditModal({
  open,
  orgId,
  settings,
  onClose,
  onSaved,
}: GovernanceEditModalProps) {
  const [draft, setDraft] = React.useState<Editable>(() => toEditable(settings));
  const [saveState, setSaveState] = React.useState<SaveState>({ status: "idle" });

  const original = React.useMemo(() => toEditable(settings), [settings]);

  // Reset the draft whenever the modal (re)opens or the source settings change.
  React.useEffect(() => {
    if (open) {
      setDraft(toEditable(settings));
      setSaveState({ status: "idle" });
    }
  }, [open, settings]);

  const isSaving = saveState.status === "saving";

  // Compute the changed subset to send.
  const changedKeys = (Object.keys(draft) as (keyof Editable)[]).filter(
    (k) => draft[k] !== original[k],
  );
  const isDirty = changedKeys.length > 0;

  function setBool(key: BoolField, value: boolean) {
    setDraft((d) => ({ ...d, [key]: value }));
    if (saveState.status === "error") setSaveState({ status: "idle" });
  }

  async function handleSave() {
    if (!isDirty) return;
    const patch: Record<string, unknown> = {};
    for (const key of changedKeys) patch[key] = draft[key];

    setSaveState({ status: "saving" });
    try {
      const res = await fetch(`/api/organizations/${orgId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveState({ status: "error", message: data.message ?? "Failed to save settings." });
        return;
      }
      onSaved(data as OrgSettings);
    } catch {
      setSaveState({ status: "error", message: "Network error. Please try again." });
    }
  }

  function handleOpenChange(next: boolean) {
    if (isSaving) return;
    if (!next) onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-lg gap-0 p-0 overflow-hidden"
        showCloseButton={!isSaving}
      >
        {/* Header */}
        <DialogHeader className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
              <Shield className="size-4 text-primary" />
            </span>
            <div>
              <DialogTitle className="text-sm font-semibold text-foreground">
                Edit governance settings
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                Control approvals, creation, and membership rules for this organization.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-5 space-y-6">
          {saveState.status === "error" && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{saveState.message}</span>
            </div>
          )}

          {/* Default member role */}
          <div className="space-y-1.5">
            <Label htmlFor="default-role" className="text-sm font-medium text-foreground">
              Default member role
            </Label>
            <select
              id="default-role"
              value={draft.default_member_role}
              onChange={(e) => {
                setDraft((d) => ({ ...d, default_member_role: e.target.value as OrgRole }));
                if (saveState.status === "error") setSaveState({ status: "idle" });
              }}
              disabled={isSaving}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 transition-colors appearance-none"
            >
              {DEFAULT_ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0) + r.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Role assigned to new members when they join.
            </p>
          </div>

          {/* Boolean groups */}
          {GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </p>
              <div className="space-y-2">
                {group.rows.map((row) => (
                  <ToggleRow
                    key={row.key}
                    label={row.label}
                    checked={draft[row.key]}
                    disabled={isSaving}
                    onChange={(v) => setBool(row.key, v)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t border-border px-6 py-4">
          <Button type="button" variant="ghost" size="default" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="button"
            size="default"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="min-w-[130px] gap-1.5"
          >
            {isSaving ? (
              <>
                <Spinner />
                Saving…
              </>
            ) : (
              <>
                <Save className="size-4" />
                Save changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Toggle row ───────────────────────────────────────────────────────────────

function ToggleRow({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-3.5 py-2.5">
      <p className="text-xs text-foreground">{label}</p>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50",
          checked ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "inline-block size-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
