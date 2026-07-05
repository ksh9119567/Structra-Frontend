"use client";

import * as React from "react";
import {
  FolderKanban,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  FileText,
  Building2,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { ProjectSummary } from "@/lib/projects/types";
import type { OrganizationSummary } from "@/lib/organizations/types";
import type { TeamSummary } from "@/lib/teams/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalState =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "success"; project: ProjectSummary }
  | { phase: "error"; message: string };

type CreateProjectModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (project: ProjectSummary) => void;
  /** Pre-selected org (e.g. when opened from an organization detail page) */
  preselectedOrgId?: string;
  preselectedOrgName?: string;
  /** Pre-selected team (e.g. when opened from a team detail page) */
  preselectedTeamId?: string;
  preselectedTeamName?: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateProjectModal({
  open,
  onClose,
  onCreated,
  preselectedOrgId,
  preselectedOrgName,
  preselectedTeamId,
  preselectedTeamName,
}: CreateProjectModalProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selectedOrgId, setSelectedOrgId] = React.useState(preselectedOrgId ?? "");
  const [selectedTeamId, setSelectedTeamId] = React.useState(preselectedTeamId ?? "");
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [state, setState] = React.useState<ModalState>({ phase: "idle" });
  const [orgs, setOrgs] = React.useState<OrganizationSummary[]>([]);
  const [orgsLoading, setOrgsLoading] = React.useState(false);
  const [teams, setTeams] = React.useState<TeamSummary[]>([]);
  const [teamsLoading, setTeamsLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const isSubmitting = state.phase === "submitting";
  const isSuccess = state.phase === "success";

  // Reset form on open
  React.useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setSelectedOrgId(preselectedOrgId ?? "");
      setSelectedTeamId(preselectedTeamId ?? "");
      setNameError(null);
      setState({ phase: "idle" });
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open, preselectedOrgId, preselectedTeamId]);

  // Fetch user's orgs for the dropdown (only if no preselected org)
  React.useEffect(() => {
    if (!open || preselectedOrgId) return;
    let cancelled = false;
    setOrgsLoading(true);
    fetch("/api/organizations")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setOrgs(data.results?.data ?? []);
          setOrgsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setOrgsLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, preselectedOrgId]);

  // Fetch user's teams for the dropdown (only if no preselected team)
  React.useEffect(() => {
    if (!open || preselectedTeamId) return;
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
  }, [open, preselectedTeamId]);

  // Teams scoped to the selected organization (or standalone teams when "Personal")
  const availableTeams = React.useMemo(() => {
    if (preselectedTeamId) return [];
    return teams.filter((t) => (t.organization ?? "") === selectedOrgId);
  }, [teams, selectedOrgId, preselectedTeamId]);

  // ── Validation ──────────────────────────────────────────────────────────────

  function validate(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return "Project name is required.";
    if (trimmed.length > 255) return "Name must be 255 characters or fewer.";
    return null;
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value);
    if (nameError) setNameError(validate(e.target.value));
    if (state.phase === "error") setState({ phase: "idle" });
  }

  function handleNameBlur() {
    setNameError(validate(name));
  }

  function handleOrgChange(id: string) {
    setSelectedOrgId(id);
    // Drop the team selection if it no longer belongs to the chosen org
    setSelectedTeamId((prev) => {
      if (!prev) return prev;
      const team = teams.find((t) => t.id === prev);
      return team && (team.organization ?? "") === id ? prev : "";
    });
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const err = validate(name);
    if (err) {
      setNameError(err);
      inputRef.current?.focus();
      return;
    }

    setState({ phase: "submitting" });

    try {
      const body: Record<string, string> = { name: name.trim() };
      if (description.trim()) body.description = description.trim();

      const orgId = preselectedOrgId ?? selectedOrgId;
      const teamId = preselectedTeamId ?? selectedTeamId;
      if (orgId) body.organization_id = orgId;
      if (teamId) body.team_id = teamId;

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.field === "name") {
          setNameError(data.message);
          setState({ phase: "idle" });
          inputRef.current?.focus();
          return;
        }
        setState({ phase: "error", message: data.message ?? "Failed to create project." });
        return;
      }

      const project = data as ProjectSummary;
      setState({ phase: "success", project });
      setTimeout(() => onCreated(project), 900);
    } catch {
      setState({ phase: "error", message: "Network error. Please check your connection." });
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting) return;
    if (!nextOpen) onClose();
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-md gap-0 p-0 overflow-hidden"
        showCloseButton={!isSubmitting}
      >
        {isSuccess && state.phase === "success" ? (
          <SuccessView project={state.project} onClose={onClose} />
        ) : (
          <FormView
            name={name}
            description={description}
            selectedOrgId={selectedOrgId}
            selectedTeamId={selectedTeamId}
            nameError={nameError}
            state={state}
            isSubmitting={isSubmitting}
            inputRef={inputRef}
            orgs={orgs}
            orgsLoading={orgsLoading}
            availableTeams={availableTeams}
            teamsLoading={teamsLoading}
            preselectedOrgId={preselectedOrgId}
            preselectedOrgName={preselectedOrgName}
            preselectedTeamId={preselectedTeamId}
            preselectedTeamName={preselectedTeamName}
            onNameChange={handleNameChange}
            onNameBlur={handleNameBlur}
            onDescriptionChange={(e) => setDescription(e.target.value)}
            onOrgChange={handleOrgChange}
            onTeamChange={setSelectedTeamId}
            onSubmit={handleSubmit}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Form View ────────────────────────────────────────────────────────────────

type FormViewProps = {
  name: string;
  description: string;
  selectedOrgId: string;
  selectedTeamId: string;
  nameError: string | null;
  state: ModalState;
  isSubmitting: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  orgs: OrganizationSummary[];
  orgsLoading: boolean;
  availableTeams: TeamSummary[];
  teamsLoading: boolean;
  preselectedOrgId?: string;
  preselectedOrgName?: string;
  preselectedTeamId?: string;
  preselectedTeamName?: string;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNameBlur: () => void;
  onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onOrgChange: (id: string) => void;
  onTeamChange: (id: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
};

function FormView({
  name,
  description,
  selectedOrgId,
  selectedTeamId,
  nameError,
  state,
  isSubmitting,
  inputRef,
  orgs,
  orgsLoading,
  availableTeams,
  teamsLoading,
  preselectedOrgId,
  preselectedOrgName,
  preselectedTeamId,
  preselectedTeamName,
  onNameChange,
  onNameBlur,
  onDescriptionChange,
  onOrgChange,
  onTeamChange,
  onSubmit,
  onClose,
}: FormViewProps) {
  const canSubmit = name.trim().length > 0 && !isSubmitting;

  return (
    <>
      {/* Header */}
      <DialogHeader className="border-b border-border px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
            <FolderKanban className="size-4 text-primary" />
          </span>
          <div>
            <DialogTitle className="text-sm font-semibold text-foreground">
              Create Project
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
              You'll be set as the owner automatically.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {/* Body */}
      <form id="create-project-form" onSubmit={onSubmit} noValidate>
        <div className="px-6 py-5 space-y-4">
          {/* Form-level error */}
          {state.phase === "error" && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{state.message}</span>
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="project-name" className="text-sm font-medium text-foreground">
              Project name
              <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              ref={inputRef}
              id="project-name"
              type="text"
              value={name}
              onChange={onNameChange}
              onBlur={onNameBlur}
              placeholder="e.g. Website Redesign"
              maxLength={255}
              autoComplete="off"
              disabled={isSubmitting}
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? "project-name-error" : "project-name-hint"}
              className={cn(
                "h-10 transition-colors",
                nameError && "border-destructive focus-visible:ring-destructive/30",
              )}
            />
            <div className="min-h-[1.125rem]">
              {nameError ? (
                <p
                  id="project-name-error"
                  role="alert"
                  className="flex items-center gap-1 text-xs text-destructive"
                >
                  <AlertCircle className="size-3 shrink-0" />
                  {nameError}
                </p>
              ) : (
                <p id="project-name-hint" className="text-xs text-muted-foreground">
                  You can rename it later.
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="project-description" className="text-sm font-medium text-foreground">
              <FileText className="mr-1.5 inline size-3.5 text-muted-foreground" />
              Description
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">(optional)</span>
            </Label>
            <textarea
              id="project-description"
              value={description}
              onChange={onDescriptionChange}
              placeholder="What is this project about?"
              disabled={isSubmitting}
              rows={3}
              maxLength={500}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 transition-colors"
            />
          </div>

          {/* Organization */}
          <div className="space-y-1.5">
            <Label htmlFor="project-org" className="text-sm font-medium text-foreground">
              <Building2 className="mr-1.5 inline size-3.5 text-muted-foreground" />
              Organization
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">(optional)</span>
            </Label>
            {preselectedOrgId ? (
              /* Locked to preselected org */
              <div className="flex h-10 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 text-sm text-foreground">
                <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{preselectedOrgName ?? preselectedOrgId}</span>
                <span className="ml-auto text-xs text-muted-foreground">locked</span>
              </div>
            ) : (
              <select
                id="project-org"
                value={selectedOrgId}
                onChange={(e) => onOrgChange(e.target.value)}
                disabled={isSubmitting || orgsLoading}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 transition-colors appearance-none"
              >
                <option value="">Personal project (no organization)</option>
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-muted-foreground">
              Link this project to an organization to inherit its governance settings.
            </p>
          </div>

          {/* Team */}
          <div className="space-y-1.5">
            <Label htmlFor="project-team" className="text-sm font-medium text-foreground">
              <Users className="mr-1.5 inline size-3.5 text-muted-foreground" />
              Team
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">(optional)</span>
            </Label>
            {preselectedTeamId ? (
              /* Locked to preselected team */
              <div className="flex h-10 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 text-sm text-foreground">
                <Users className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{preselectedTeamName ?? preselectedTeamId}</span>
                <span className="ml-auto text-xs text-muted-foreground">locked</span>
              </div>
            ) : (
              <select
                id="project-team"
                value={selectedTeamId}
                onChange={(e) => onTeamChange(e.target.value)}
                disabled={isSubmitting || teamsLoading}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 transition-colors appearance-none"
              >
                <option value="">No team</option>
                {availableTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-muted-foreground">
              Scope this project to one of your teams within the selected organization.
            </p>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            size="default"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-project-form"
            size="default"
            disabled={!canSubmit}
            className="min-w-[120px] gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Spinner />
                Creating…
              </>
            ) : (
              <>
                <FolderKanban className="size-4" />
                Create Project
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

// ─── Success View ─────────────────────────────────────────────────────────────

function SuccessView({ project, onClose }: { project: ProjectSummary; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-success/15">
        <CheckCircle2 className="size-7 text-success" />
      </span>

      <h3 className="text-base font-semibold text-foreground">Project created</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{project.name}</span> is ready.
        You're the owner.
      </p>
      {(project.team_name || project.organization_name) && (
        <p className="mt-1 text-xs text-muted-foreground">
          Linked to{" "}
          <span className="font-medium text-foreground">
            {project.team_name ?? project.organization_name}
          </span>
        </p>
      )}

      <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        <Button variant="ghost" size="default" onClick={onClose}>
          Close
        </Button>
        <Button size="default" className="gap-1.5" asChild>
          <a href={`/projects/${project.id}`}>
            Open Project
            <ArrowRight className="size-4" />
          </a>
        </Button>
      </div>
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
