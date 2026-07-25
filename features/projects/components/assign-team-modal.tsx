"use client";

import * as React from "react";
import { Users, Shield, Crown, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Spinner, RoleOptionCard, FormErrorBanner } from "@/features/shared/members/member-ui";
import type { ProjectRole, ProjectTeamLink } from "@/lib/projects/types";
import type { TeamSummary } from "@/lib/teams/types";

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
  | { phase: "assigning" }
  | { phase: "success"; link: ProjectTeamLink }
  | { phase: "error"; message: string };

export type AssignTeamModalProps = {
  open: boolean;
  projectId: string;
  projectName: string;
  projectOrganizationId: string | null;
  existingTeamIds: string[];
  onClose: () => void;
  onAssigned?: (link: ProjectTeamLink) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AssignTeamModal({
  open,
  projectId,
  projectName,
  projectOrganizationId,
  existingTeamIds,
  onClose,
  onAssigned,
}: AssignTeamModalProps) {
  const [teams, setTeams] = React.useState<TeamSummary[]>([]);
  const [teamsLoading, setTeamsLoading] = React.useState(false);
  const [selectedTeamId, setSelectedTeamId] = React.useState("");
  const [role, setRole] = React.useState<ProjectRole>("CONTRIBUTOR");
  const [isOwning, setIsOwning] = React.useState(false);
  const [state, setState] = React.useState<ModalState>({ phase: "idle" });

  const isAssigning = state.phase === "assigning";
  const isSuccess = state.phase === "success";

  React.useEffect(() => {
    if (open) {
      setSelectedTeamId("");
      setRole("CONTRIBUTOR");
      setIsOwning(false);
      setState({ phase: "idle" });
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setTeamsLoading(true);
    fetch("/api/teams")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setTeams(data.results?.data ?? []);
          setTeamsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setTeamsLoading(false);
      });
    return () => { cancelled = true; };
  }, [open]);

  // A project with an org can only assign teams from that same org (backend
  // rule); a standalone project has no such constraint.
  const availableTeams = React.useMemo(() => {
    return teams.filter((t) => {
      if (existingTeamIds.includes(t.id)) return false;
      if (projectOrganizationId) return t.organization === projectOrganizationId;
      return true;
    });
  }, [teams, projectOrganizationId, existingTeamIds]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTeamId) return;

    setState({ phase: "assigning" });
    try {
      const res = await fetch(`/api/projects/${projectId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: selectedTeamId, role, is_owning: isOwning }),
      });
      const data = await res.json();

      if (!res.ok) {
        setState({ phase: "error", message: data.message ?? "Failed to assign team." });
        return;
      }

      setState({ phase: "success", link: data as ProjectTeamLink });
      onAssigned?.(data as ProjectTeamLink);
    } catch {
      setState({ phase: "error", message: "Network error. Please check your connection." });
    }
  }

  function handleOpenChange(next: boolean) {
    if (isAssigning) return;
    if (!next) onClose();
  }

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0 overflow-hidden" showCloseButton={!isAssigning}>
        {isSuccess && state.phase === "success" ? (
          <SuccessView link={state.link} projectName={projectName} onClose={onClose} />
        ) : (
          <>
            <DialogHeader className="border-b border-border px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                  <Users className="size-4 text-primary" />
                </span>
                <div>
                  <DialogTitle className="text-sm font-semibold text-foreground">
                    Assign Team
                  </DialogTitle>
                  <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                    Grant a whole team access to{" "}
                    <span className="font-medium text-foreground">{projectName}</span>.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form id="assign-team-form" onSubmit={handleSubmit} noValidate>
              <div className="space-y-5 px-6 py-5">
                {state.phase === "error" && <FormErrorBanner message={state.message} />}

                {/* Team select */}
                <div className="space-y-1.5">
                  <Label htmlFor="assign-team-select" className="text-sm font-medium text-foreground">
                    Team
                    <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>
                  </Label>
                  <select
                    id="assign-team-select"
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    disabled={isAssigning || teamsLoading}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 transition-colors appearance-none"
                  >
                    <option value="">
                      {teamsLoading ? "Loading teams…" : "Select a team"}
                    </option>
                    {availableTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  {!teamsLoading && availableTeams.length === 0 && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <AlertCircle className="size-3 shrink-0" />
                      No eligible teams — every compatible team is already assigned.
                    </p>
                  )}
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    <Shield className="mr-1.5 inline size-3.5 text-muted-foreground" />
                    Role
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLE_META.map((r) => (
                      <RoleOptionCard
                        key={r.value}
                        badge={<ProjectRoleBadge role={r.value} />}
                        description={r.description}
                        selected={role === r.value}
                        disabled={isAssigning}
                        variant="compact"
                        onSelect={() => setRole(r.value)}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Every member of {selectedTeam?.name ?? "this team"} inherits this role
                    dynamically — nobody is added to the member list.
                  </p>
                </div>

                {/* Owning */}
                <label className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 px-3.5 py-3">
                  <Checkbox
                    checked={isOwning}
                    onCheckedChange={(checked) => setIsOwning(checked === true)}
                    disabled={isAssigning}
                    className="mt-0.5"
                  />
                  <span className="text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                      <Crown className="size-3.5" />
                      Set as owning team
                    </span>
                    For accountability and reporting only — grants no extra authority. Only
                    one team can be owning at a time.
                  </span>
                </label>
              </div>

              <DialogFooter className="px-6 py-4">
                <Button type="button" variant="ghost" size="default" onClick={onClose} disabled={isAssigning}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="assign-team-form"
                  size="default"
                  disabled={!selectedTeamId || isAssigning}
                  className="min-w-[120px] gap-1.5"
                >
                  {isAssigning ? <><Spinner />Assigning…</> : <><Users className="size-4" />Assign Team</>}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Success view ─────────────────────────────────────────────────────────────

function SuccessView({
  link, projectName, onClose,
}: { link: ProjectTeamLink; projectName: string; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-success/15">
        <svg className="size-7 text-success" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 4 12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <h3 className="text-base font-semibold text-foreground">Team assigned</h3>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{link.team_name}</span> now has access
        to <span className="font-medium text-foreground">{projectName}</span>.
      </p>
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5">
        <Shield className="size-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Assigned as</span>
        <ProjectRoleBadge role={link.role} />
      </div>
      <Button size="default" onClick={onClose} className="mt-6 gap-1.5">
        Done
      </Button>
    </div>
  );
}
