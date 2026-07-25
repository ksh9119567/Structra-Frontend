"use client";

import * as React from "react";
import { Shield, Crown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ProjectRoleBadge } from "./project-role-badge";
import { Spinner, RoleOptionCard, FormErrorBanner } from "@/features/shared/members/member-ui";
import type { ProjectRole, ProjectTeamLink } from "@/lib/projects/types";

// ─── Constants ────────────────────────────────────────────────────────────────

// Matches TEAM_ASSIGNABLE_ROLES in lib/roles.ts (OWNER/GUEST excluded).
const ROLE_META: { value: ProjectRole; label: string; description: string }[] = [
  { value: "MANAGER",     label: "Manager",     description: "Manage tasks and members" },
  { value: "LEAD",        label: "Lead",        description: "Assign and oversee tasks" },
  { value: "CONTRIBUTOR", label: "Contributor", description: "Work on assigned tasks" },
  { value: "VIEWER",      label: "Viewer",      description: "Read-only access" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalState =
  | { phase: "idle" }
  | { phase: "saving" }
  | { phase: "success" }
  | { phase: "error"; message: string };

export type ChangeTeamLinkModalProps = {
  open: boolean;
  projectId: string;
  link: ProjectTeamLink | null;
  onClose: () => void;
  onChanged?: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ChangeTeamLinkModal({ open, projectId, link, onClose, onChanged }: ChangeTeamLinkModalProps) {
  const [role, setRole] = React.useState<ProjectRole | null>(null);
  const [isOwning, setIsOwning] = React.useState(false);
  const [state, setState] = React.useState<ModalState>({ phase: "idle" });

  const isSaving = state.phase === "saving";

  React.useEffect(() => {
    if (open && link) {
      setRole(link.role);
      setIsOwning(link.is_owning);
      setState({ phase: "idle" });
    }
  }, [open, link]);

  if (!link) return null;

  const isDirty = role !== link.role || isOwning !== link.is_owning;

  async function handleSave() {
    if (!link || !isDirty) return;
    setState({ phase: "saving" });

    const body: { role?: ProjectRole; is_owning?: boolean } = {};
    if (role !== link.role) body.role = role ?? undefined;
    if (isOwning !== link.is_owning) body.is_owning = isOwning;

    try {
      const res = await fetch(`/api/projects/${projectId}/teams/${link.team}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ phase: "error", message: data.message ?? "Failed to update team." });
        return;
      }
      setState({ phase: "success" });
      onChanged?.();
      onClose();
    } catch {
      setState({ phase: "error", message: "Network error. Please check your connection." });
    }
  }

  function handleOpenChange(next: boolean) {
    if (isSaving) return;
    if (!next) onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0 overflow-hidden" showCloseButton={!isSaving}>
        <DialogHeader className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
              <Shield className="size-4 text-primary" />
            </span>
            <div>
              <DialogTitle className="text-sm font-semibold text-foreground">
                Change Team Access
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                Update how <span className="font-medium text-foreground">{link.team_name}</span>{" "}
                is linked to this project.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          {state.phase === "error" && <FormErrorBanner message={state.message} />}

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Role</p>
            <div className="space-y-2">
              {ROLE_META.map((r) => (
                <RoleOptionCard
                  key={r.value}
                  badge={<ProjectRoleBadge role={r.value} />}
                  description={r.description}
                  isCurrent={r.value === link.role}
                  selected={role === r.value}
                  disabled={isSaving}
                  variant="full"
                  onSelect={() => setRole(r.value)}
                />
              ))}
            </div>
          </div>

          <label className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 px-3.5 py-3">
            <Checkbox
              checked={isOwning}
              onCheckedChange={(checked) => setIsOwning(checked === true)}
              disabled={isSaving}
              className="mt-0.5"
            />
            <span className="text-xs text-muted-foreground">
              <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                <Crown className="size-3.5" />
                Owning team
              </span>
              For accountability and reporting only — grants no extra authority. Unchecking
              the current owning team requires promoting another instead.
            </span>
          </label>
        </div>

        <DialogFooter className="px-6 py-4">
          <Button type="button" variant="ghost" size="default" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            size="default"
            disabled={!isDirty || isSaving}
            onClick={handleSave}
            className="min-w-[100px] gap-1.5"
          >
            {isSaving ? <><Spinner />Saving…</> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
