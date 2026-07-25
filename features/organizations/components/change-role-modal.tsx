"use client";

import * as React from "react";
import {
  Shield,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { OrgRoleBadge } from "./org-role-badge";
import type { OrgMembership, OrgRole } from "@/lib/organizations/types";

// ─── Role metadata ────────────────────────────────────────────────────────────

import { ORG_ROLE_LEVEL as ROLE_LEVEL } from "@/lib/roles";

type RoleMeta = {
  value: OrgRole;
  label: string;
  description: string;
  permissions: string[];
};

const ROLE_META: RoleMeta[] = [
  {
    value: "ADMIN",
    label: "Admin",
    description: "Full control except deleting the organization",
    permissions: [
      "Invite, update, and remove members",
      "Create and manage teams",
      "Create and manage projects",
      "View all activity logs",
    ],
  },
  {
    value: "MANAGER",
    label: "Manager",
    description: "Manage teams and projects",
    permissions: [
      "Create and manage teams",
      "Create and manage projects",
      "View members",
    ],
  },
  {
    value: "MEMBER",
    label: "Member",
    description: "Standard access to assigned work",
    permissions: [
      "View teams and projects",
      "Work on assigned tasks",
    ],
  },
  {
    value: "VIEWER",
    label: "Viewer",
    description: "Read-only access",
    permissions: [
      "View teams and projects",
      "Cannot create or modify anything",
    ],
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalPhase =
  | { phase: "idle" }
  | { phase: "saving" }
  | { phase: "success"; newRole: OrgRole }
  | { phase: "error"; message: string };

export type ChangeRoleModalProps = {
  open: boolean;
  orgId: string;
  member: OrgMembership | null;
  /** The current user's role — used to enforce hierarchy on the client */
  currentUserRole: OrgRole;
  onClose: () => void;
  /** Called after a successful role change so the parent can refresh the list */
  onRoleChanged?: (memberEmail: string, newRole: OrgRole) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ChangeRoleModal({
  open,
  orgId,
  member,
  currentUserRole,
  onClose,
  onRoleChanged,
}: ChangeRoleModalProps) {
  const [selectedRole, setSelectedRole] = React.useState<OrgRole | null>(null);
  const [modalState, setModalState] = React.useState<ModalPhase>({ phase: "idle" });

  const isSaving = modalState.phase === "saving";
  const isSuccess = modalState.phase === "success";

  // Reset when modal opens with a new member
  React.useEffect(() => {
    if (open && member) {
      setSelectedRole(member.role);
      setModalState({ phase: "idle" });
    }
  }, [open, member]);

  if (!member) return null;

  const memberEmail = member.user_email;
  const currentUserLevel = ROLE_LEVEL[currentUserRole];
  const targetCurrentLevel = ROLE_LEVEL[member.role];

  // Roles the current user is allowed to assign:
  // - Must be lower than current user's own level
  // - Cannot assign OWNER (ownership is transferred separately)
  const assignableRoles = ROLE_META.filter(
    (r) => ROLE_LEVEL[r.value] < currentUserLevel && r.value !== "OWNER",
  );

  const isDirty = selectedRole !== null && selectedRole !== member.role;
  const canSave = isDirty && !isSaving;

  // Warn when downgrading from a higher role
  const isDowngrade =
    selectedRole !== null &&
    selectedRole !== member.role &&
    ROLE_LEVEL[selectedRole] < targetCurrentLevel;

  const isUpgrade =
    selectedRole !== null &&
    selectedRole !== member.role &&
    ROLE_LEVEL[selectedRole] > targetCurrentLevel;

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!selectedRole || !isDirty) return;
    setModalState({ phase: "saving" });

    try {
      const res = await fetch(
        `/api/organizations/${orgId}/members/${encodeURIComponent(memberEmail)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: selectedRole }),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        setModalState({ phase: "error", message: data.message ?? "Failed to update role." });
        return;
      }

      setModalState({ phase: "success", newRole: selectedRole });
      onRoleChanged?.(memberEmail, selectedRole);
    } catch {
      setModalState({ phase: "error", message: "Network error. Please check your connection." });
    }
  }

  function handleOpenChange(next: boolean) {
    if (isSaving) return;
    if (!next) onClose();
  }

  const initials = member.user_email.split("@")[0].slice(0, 2).toUpperCase();

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-lg gap-0 p-0 overflow-hidden"
        showCloseButton={!isSaving}
      >
        {isSuccess && modalState.phase === "success" ? (
          <SuccessView
            member={member}
            newRole={modalState.newRole}
            onClose={onClose}
          />
        ) : (
          <>
            {/* Header */}
            <DialogHeader className="border-b border-border px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                  <Shield className="size-4 text-primary" />
                </span>
                <div>
                  <DialogTitle className="text-sm font-semibold text-foreground">
                    Change Role
                  </DialogTitle>
                  <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                    Update permissions for this member.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="px-6 py-5 space-y-5">
              {/* Error banner */}
              {modalState.phase === "error" && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{modalState.message}</span>
                </div>
              )}

              {/* Member identity card */}
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {member.user_email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined{" "}
                    {new Date(member.joined_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {/* Current → new role arrow */}
                <div className="flex shrink-0 items-center gap-2">
                  <OrgRoleBadge role={member.role} />
                  {selectedRole && selectedRole !== member.role && (
                    <>
                      <ChevronRight className="size-3.5 text-muted-foreground" />
                      <OrgRoleBadge role={selectedRole} />
                    </>
                  )}
                </div>
              </div>

              {/* Role selector */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Select new role
                </p>
                <div className="space-y-2">
                  {assignableRoles.map((r) => {
                    const isSelected = selectedRole === r.value;
                    const isCurrent = member.role === r.value;
                    return (
                      <RoleCard
                        key={r.value}
                        meta={r}
                        isSelected={isSelected}
                        isCurrent={isCurrent}
                        disabled={isSaving}
                        onSelect={() => !isSaving && setSelectedRole(r.value)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Permission impact warning */}
              {isDowngrade && (
                <PermissionWarning
                  type="downgrade"
                  from={member.role}
                  to={selectedRole!}
                />
              )}
              {isUpgrade && (
                <PermissionWarning
                  type="upgrade"
                  from={member.role}
                  to={selectedRole!}
                />
              )}
            </div>

            {/* Footer */}
            <DialogFooter className="px-6 py-4">
              <Button
                type="button"
                variant="ghost"
                size="default"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                size="default"
                disabled={!canSave}
                onClick={handleSave}
                className="min-w-[120px] gap-1.5"
              >
                {isSaving ? (
                  <>
                    <Spinner />
                    Saving…
                  </>
                ) : (
                  <>
                    <Shield className="size-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Role Card ────────────────────────────────────────────────────────────────

function RoleCard({
  meta,
  isSelected,
  isCurrent,
  disabled,
  onSelect,
}: {
  meta: RoleMeta;
  isSelected: boolean;
  isCurrent: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={isSelected}
      className={cn(
        "group w-full rounded-lg border p-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
        isSelected
          ? "border-primary bg-primary/8 ring-1 ring-primary/30"
          : "border-border bg-background hover:border-border/80 hover:bg-accent/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: badge + description */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <OrgRoleBadge role={meta.value} />
            {isCurrent && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                current
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{meta.description}</p>

          {/* Permission list — shown when selected */}
          {isSelected && (
            <ul className="mt-2.5 space-y-1">
              {meta.permissions.map((p) => (
                <li key={p} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary/60" />
                  {p}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: selection indicator */}
        <span
          className={cn(
            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
            isSelected
              ? "border-primary bg-primary"
              : "border-border bg-background group-hover:border-primary/50",
          )}
        >
          {isSelected && (
            <svg viewBox="0 0 12 12" className="size-2.5 text-primary-foreground" fill="none">
              <path
                d="M2 6l3 3 5-5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      </div>
    </button>
  );
}

// ─── Permission Impact Warning ────────────────────────────────────────────────

const DOWNGRADE_WARNINGS: Partial<Record<OrgRole, string>> = {
  ADMIN: "This member will lose the ability to invite, update, and remove other members.",
  MANAGER: "This member will lose team and project management permissions.",
  MEMBER: "This member will lose the ability to create or modify content.",
};

const UPGRADE_NOTES: Partial<Record<OrgRole, string>> = {
  ADMIN: "This member will gain full administrative control over the organization.",
  MANAGER: "This member will be able to create and manage teams and projects.",
};

function PermissionWarning({
  type,
  from,
  to,
}: {
  type: "downgrade" | "upgrade";
  from: OrgRole;
  to: OrgRole;
}) {
  const message =
    type === "downgrade"
      ? DOWNGRADE_WARNINGS[from] ?? `Permissions will be reduced from ${from} to ${to}.`
      : UPGRADE_NOTES[to] ?? `Permissions will be expanded from ${from} to ${to}.`;

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

// ─── Success View ─────────────────────────────────────────────────────────────

function SuccessView({
  member,
  newRole,
  onClose,
}: {
  member: OrgMembership;
  newRole: OrgRole;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-success/15">
        <CheckCircle2 className="size-7 text-success" />
      </span>

      <h3 className="text-base font-semibold text-foreground">Role updated</h3>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{member.user_email}</span> is
        now a{" "}
        <span className="font-medium text-foreground">
          {newRole.charAt(0) + newRole.slice(1).toLowerCase()}
        </span>
        .
      </p>

      {/* Before → after */}
      <div className="mt-5 flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-5 py-3">
        <OrgRoleBadge role={member.role} />
        <ArrowRight className="size-3.5 text-muted-foreground" />
        <OrgRoleBadge role={newRole} />
      </div>

      <Button size="default" onClick={onClose} className="mt-6 gap-1.5">
        Done
        <ArrowRight className="size-4" />
      </Button>
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
