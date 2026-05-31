"use client";

import * as React from "react";
import { Shield, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { TeamRoleBadge } from "./team-role-badge";
import {
  Spinner,
  MemberIdentityCard,
  RoleOptionCard,
  PermissionWarningBanner,
  FormErrorBanner,
} from "@/features/shared/members/member-ui";
import type { TeamMembership, TeamRole } from "@/lib/teams/types";

// ─── Role hierarchy ───────────────────────────────────────────────────────────

const ROLE_LEVEL: Record<TeamRole, number> = {
  OWNER: 5, MANAGER: 4, LEAD: 3, MEMBER: 2, VIEWER: 1,
};

type RoleMeta = {
  value: TeamRole;
  label: string;
  description: string;
  permissions: string[];
};

const ROLE_META: RoleMeta[] = [
  {
    value: "MANAGER",
    label: "Manager",
    description: "Manage team members and projects",
    permissions: [
      "Invite, update, and remove members",
      "Create and manage projects",
      "View all team activity",
    ],
  },
  {
    value: "LEAD",
    label: "Lead",
    description: "Assign tasks and manage workflows",
    permissions: [
      "Assign tasks to team members",
      "Manage project workflows",
      "View members",
    ],
  },
  {
    value: "MEMBER",
    label: "Member",
    description: "Standard access to assigned work",
    permissions: [
      "View projects and tasks",
      "Work on assigned tasks",
    ],
  },
  {
    value: "VIEWER",
    label: "Viewer",
    description: "Read-only access",
    permissions: [
      "View projects and tasks",
      "Cannot create or modify anything",
    ],
  },
];

// ─── Permission warning messages ──────────────────────────────────────────────

const DOWNGRADE_WARNINGS: Partial<Record<TeamRole, string>> = {
  MANAGER: "This member will lose the ability to invite, update, and remove other members.",
  LEAD: "This member will lose task assignment and workflow management permissions.",
  MEMBER: "This member will lose the ability to create or modify content.",
};

const UPGRADE_NOTES: Partial<Record<TeamRole, string>> = {
  MANAGER: "This member will gain full management control over the team.",
  LEAD: "This member will be able to assign tasks and manage workflows.",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalPhase =
  | { phase: "idle" }
  | { phase: "saving" }
  | { phase: "success"; newRole: TeamRole }
  | { phase: "error"; message: string };

export type ChangeTeamRoleModalProps = {
  open: boolean;
  teamId: string;
  member: TeamMembership | null;
  currentUserRole: TeamRole;
  onClose: () => void;
  onRoleChanged?: (memberEmail: string, newRole: TeamRole) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ChangeTeamRoleModal({
  open,
  teamId,
  member,
  currentUserRole,
  onClose,
  onRoleChanged,
}: ChangeTeamRoleModalProps) {
  const [selectedRole, setSelectedRole] = React.useState<TeamRole | null>(null);
  const [modalState, setModalState] = React.useState<ModalPhase>({ phase: "idle" });

  const isSaving = modalState.phase === "saving";
  const isSuccess = modalState.phase === "success";

  React.useEffect(() => {
    if (open && member) {
      setSelectedRole(member.role);
      setModalState({ phase: "idle" });
    }
  }, [open, member]);

  if (!member) return null;

  const currentUserLevel = ROLE_LEVEL[currentUserRole];
  const targetCurrentLevel = ROLE_LEVEL[member.role];

  const assignableRoles = ROLE_META.filter(
    (r) => ROLE_LEVEL[r.value] < currentUserLevel && r.value !== "OWNER",
  );

  const isDirty = selectedRole !== null && selectedRole !== member.role;
  const canSave = isDirty && !isSaving;

  const isDowngrade =
    selectedRole !== null &&
    selectedRole !== member.role &&
    ROLE_LEVEL[selectedRole] < targetCurrentLevel;

  const isUpgrade =
    selectedRole !== null &&
    selectedRole !== member.role &&
    ROLE_LEVEL[selectedRole] > targetCurrentLevel;

  async function handleSave() {
    if (!selectedRole || !isDirty) return;
    setModalState({ phase: "saving" });

    try {
      const res = await fetch(
        `/api/teams/${teamId}/members/${encodeURIComponent(member.user_email)}`,
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
      onRoleChanged?.(member.user_email, selectedRole);
    } catch {
      setModalState({ phase: "error", message: "Network error. Please check your connection." });
    }
  }

  function handleOpenChange(next: boolean) {
    if (isSaving) return;
    if (!next) onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0 overflow-hidden" showCloseButton={!isSaving}>
        {isSuccess && modalState.phase === "success" ? (
          <SuccessView member={member} newRole={modalState.newRole} onClose={onClose} />
        ) : (
          <>
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
                    Update permissions for this team member.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="px-6 py-5 space-y-5">
              {modalState.phase === "error" && (
                <FormErrorBanner message={modalState.message} />
              )}

              <MemberIdentityCard
                email={member.user_email}
                joinedAt={member.joined_at}
                currentRoleBadge={<TeamRoleBadge role={member.role} />}
                nextRoleBadge={
                  selectedRole && selectedRole !== member.role
                    ? <TeamRoleBadge role={selectedRole} />
                    : undefined
                }
              />

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Select new role
                </p>
                <div className="space-y-2">
                  {assignableRoles.map((r) => (
                    <RoleOptionCard
                      key={r.value}
                      badge={<TeamRoleBadge role={r.value} />}
                      description={r.description}
                      permissions={r.permissions}
                      selected={selectedRole === r.value}
                      isCurrent={member.role === r.value}
                      disabled={isSaving}
                      variant="full"
                      onSelect={() => !isSaving && setSelectedRole(r.value)}
                    />
                  ))}
                </div>
              </div>

              {isDowngrade && (
                <PermissionWarningBanner
                  type="downgrade"
                  message={
                    DOWNGRADE_WARNINGS[member.role] ??
                    `Permissions will be reduced from ${member.role} to ${selectedRole}.`
                  }
                />
              )}
              {isUpgrade && (
                <PermissionWarningBanner
                  type="upgrade"
                  message={
                    UPGRADE_NOTES[selectedRole!] ??
                    `Permissions will be expanded from ${member.role} to ${selectedRole}.`
                  }
                />
              )}
            </div>

            <DialogFooter className="px-6 py-4">
              <Button type="button" variant="ghost" size="default" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                size="default"
                disabled={!canSave}
                onClick={handleSave}
                className="min-w-[120px] gap-1.5"
              >
                {isSaving ? <><Spinner />Saving…</> : <><Shield className="size-4" />Save Changes</>}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Success View ─────────────────────────────────────────────────────────────

function SuccessView({
  member, newRole, onClose,
}: {
  member: TeamMembership; newRole: TeamRole; onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-success/15">
        <svg className="size-7 text-success" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 4 12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <h3 className="text-base font-semibold text-foreground">Role updated</h3>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{member.user_email}</span> is now a{" "}
        <span className="font-medium text-foreground">
          {newRole.charAt(0) + newRole.slice(1).toLowerCase()}
        </span>.
      </p>
      <div className="mt-5 flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-5 py-3">
        <TeamRoleBadge role={member.role} />
        <ArrowRight className="size-3.5 text-muted-foreground" />
        <TeamRoleBadge role={newRole} />
      </div>
      <Button size="default" onClick={onClose} className="mt-6 gap-1.5">
        Done <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
