"use client";

import * as React from "react";
import { Shield, AlertCircle, Save, Lock } from "lucide-react";

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
import { ProjectRoleBadge } from "./project-role-badge";
import type { ProjectSettings, ProjectRole } from "@/lib/projects/types";

// ─── Editable field config ──────────────────────────────────────────────────
// Bounds mirror PROJECT_ACTION_POLICIES in the backend (core/constants/project_constant.py).
// invite_member/create_task/update_task range CONTRIBUTOR(or LEAD)–MANAGER; update_member,
// remove_member, and delete_task are fixed at MANAGER (floor == ceiling), so they aren't
// editable and are shown read-only for transparency instead.

type EditableField = "invite_member_min_role" | "create_task_min_role" | "update_task_min_role";

const EDITABLE_ROWS: { key: EditableField; label: string; options: ProjectRole[] }[] = [
  { key: "invite_member_min_role", label: "Invite members", options: ["LEAD", "MANAGER"] },
  { key: "create_task_min_role", label: "Create tasks", options: ["CONTRIBUTOR", "LEAD", "MANAGER"] },
  { key: "update_task_min_role", label: "Update tasks", options: ["CONTRIBUTOR", "LEAD", "MANAGER"] },
];

const LOCKED_ROWS: { key: "update_member_min_role" | "remove_member_min_role" | "delete_task_min_role"; label: string }[] = [
  { key: "update_member_min_role", label: "Update members" },
  { key: "remove_member_min_role", label: "Remove members" },
  { key: "delete_task_min_role", label: "Delete tasks" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type Editable = Record<EditableField, ProjectRole>;

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "error"; message: string };

type ProjectRolePermissionsEditModalProps = {
  open: boolean;
  projectId: string;
  settings: ProjectSettings;
  onClose: () => void;
  onSaved: (updated: ProjectSettings) => void;
};

function toEditable(s: ProjectSettings): Editable {
  return {
    invite_member_min_role: s.invite_member_min_role,
    create_task_min_role: s.create_task_min_role,
    update_task_min_role: s.update_task_min_role,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectRolePermissionsEditModal({
  open,
  projectId,
  settings,
  onClose,
  onSaved,
}: ProjectRolePermissionsEditModalProps) {
  const [draft, setDraft] = React.useState<Editable>(() => toEditable(settings));
  const [saveState, setSaveState] = React.useState<SaveState>({ status: "idle" });

  const original = React.useMemo(() => toEditable(settings), [settings]);

  React.useEffect(() => {
    if (open) {
      setDraft(toEditable(settings));
      setSaveState({ status: "idle" });
    }
  }, [open, settings]);

  const isSaving = saveState.status === "saving";

  const changedKeys = (Object.keys(draft) as EditableField[]).filter(
    (k) => draft[k] !== original[k],
  );
  const isDirty = changedKeys.length > 0;

  function setRole(key: EditableField, value: ProjectRole) {
    setDraft((d) => ({ ...d, [key]: value }));
    if (saveState.status === "error") setSaveState({ status: "idle" });
  }

  async function handleSave() {
    if (!isDirty) return;
    const patch: Record<string, unknown> = {};
    for (const key of changedKeys) patch[key] = draft[key];

    setSaveState({ status: "saving" });
    try {
      const res = await fetch(`/api/projects/${projectId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveState({ status: "error", message: data.message ?? "Failed to save role permissions." });
        return;
      }
      onSaved(data as ProjectSettings);
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
        className="max-w-md gap-0 p-0 overflow-hidden"
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
                Edit role permissions
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                Set the minimum role required for each action.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {saveState.status === "error" && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{saveState.message}</span>
            </div>
          )}

          <div className="space-y-3">
            {EDITABLE_ROWS.map((row) => (
              <div key={row.key} className="flex items-center justify-between gap-3">
                <Label htmlFor={row.key} className="text-sm font-medium text-foreground">
                  {row.label}
                </Label>
                <select
                  id={row.key}
                  value={draft[row.key]}
                  onChange={(e) => setRole(row.key, e.target.value as ProjectRole)}
                  disabled={isSaving}
                  className="h-9 w-32 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 transition-colors appearance-none"
                >
                  {row.options.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0) + r.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="border-t border-border/60 pt-4 space-y-2">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3 shrink-0" />
              Fixed by system policy — not configurable
            </p>
            {LOCKED_ROWS.map((row) => (
              <div key={row.key} className="flex items-center justify-between gap-3 opacity-70">
                <p className="text-sm text-muted-foreground">{row.label}</p>
                <ProjectRoleBadge role={settings[row.key]} />
              </div>
            ))}
          </div>
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

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className={cn("size-4 animate-spin")} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
