"use client";

import * as React from "react";
import { Users, AlertCircle, CheckCircle2, ArrowRight, FileText, Building2 } from "lucide-react";

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
import type { TeamSummary } from "@/lib/teams/types";
import type { OrganizationSummary } from "@/lib/organizations/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalState =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "success"; team: TeamSummary }
  | { phase: "error"; message: string };

type CreateTeamModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (team: TeamSummary) => void;
  /** Pre-selected org (e.g. when opened from org detail page) */
  preselectedOrgId?: string;
  preselectedOrgName?: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateTeamModal({
  open,
  onClose,
  onCreated,
  preselectedOrgId,
  preselectedOrgName,
}: CreateTeamModalProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selectedOrgId, setSelectedOrgId] = React.useState(preselectedOrgId ?? "");
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [state, setState] = React.useState<ModalState>({ phase: "idle" });
  const [orgs, setOrgs] = React.useState<OrganizationSummary[]>([]);
  const [orgsLoading, setOrgsLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const isSubmitting = state.phase === "submitting";
  const isSuccess = state.phase === "success";

  // Reset form on open
  React.useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setSelectedOrgId(preselectedOrgId ?? "");
      setNameError(null);
      setState({ phase: "idle" });
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open, preselectedOrgId]);

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

  // ── Validation ──────────────────────────────────────────────────────────────

  function validate(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return "Team name is required.";
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
      if (selectedOrgId) body.organization_id = selectedOrgId;

      const res = await fetch("/api/teams", {
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
        setState({ phase: "error", message: data.message ?? "Failed to create team." });
        return;
      }

      const team = data as TeamSummary;
      setState({ phase: "success", team });
      setTimeout(() => onCreated(team), 900);
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
          <SuccessView team={state.team} onClose={onClose} />
        ) : (
          <FormView
            name={name}
            description={description}
            selectedOrgId={selectedOrgId}
            nameError={nameError}
            state={state}
            isSubmitting={isSubmitting}
            inputRef={inputRef}
            orgs={orgs}
            orgsLoading={orgsLoading}
            preselectedOrgId={preselectedOrgId}
            preselectedOrgName={preselectedOrgName}
            onNameChange={handleNameChange}
            onNameBlur={handleNameBlur}
            onDescriptionChange={(e) => setDescription(e.target.value)}
            onOrgChange={setSelectedOrgId}
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
  nameError: string | null;
  state: ModalState;
  isSubmitting: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  orgs: OrganizationSummary[];
  orgsLoading: boolean;
  preselectedOrgId?: string;
  preselectedOrgName?: string;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNameBlur: () => void;
  onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onOrgChange: (id: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
};

function FormView({
  name,
  description,
  selectedOrgId,
  nameError,
  state,
  isSubmitting,
  inputRef,
  orgs,
  orgsLoading,
  preselectedOrgId,
  preselectedOrgName,
  onNameChange,
  onNameBlur,
  onDescriptionChange,
  onOrgChange,
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
            <Users className="size-4 text-primary" />
          </span>
          <div>
            <DialogTitle className="text-sm font-semibold text-foreground">
              Create Team
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
              You'll be set as the owner automatically.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {/* Body */}
      <form id="create-team-form" onSubmit={onSubmit} noValidate>
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
            <Label htmlFor="team-name" className="text-sm font-medium text-foreground">
              Team name
              <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              ref={inputRef}
              id="team-name"
              type="text"
              value={name}
              onChange={onNameChange}
              onBlur={onNameBlur}
              placeholder="e.g. Frontend Engineers"
              maxLength={255}
              autoComplete="off"
              disabled={isSubmitting}
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? "team-name-error" : "team-name-hint"}
              className={cn(
                "h-10 transition-colors",
                nameError && "border-destructive focus-visible:ring-destructive/30",
              )}
            />
            <div className="min-h-[1.125rem]">
              {nameError ? (
                <p
                  id="team-name-error"
                  role="alert"
                  className="flex items-center gap-1 text-xs text-destructive"
                >
                  <AlertCircle className="size-3 shrink-0" />
                  {nameError}
                </p>
              ) : (
                <p id="team-name-hint" className="text-xs text-muted-foreground">
                  You can rename it later.
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="team-description" className="text-sm font-medium text-foreground">
              <FileText className="mr-1.5 inline size-3.5 text-muted-foreground" />
              Description
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">(optional)</span>
            </Label>
            <textarea
              id="team-description"
              value={description}
              onChange={onDescriptionChange}
              placeholder="What does this team work on?"
              disabled={isSubmitting}
              rows={3}
              maxLength={500}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 transition-colors"
            />
          </div>

          {/* Organization */}
          <div className="space-y-1.5">
            <Label htmlFor="team-org" className="text-sm font-medium text-foreground">
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
                id="team-org"
                value={selectedOrgId}
                onChange={(e) => onOrgChange(e.target.value)}
                disabled={isSubmitting || orgsLoading}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 transition-colors"
              >
                <option value="">No organization (standalone team)</option>
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-muted-foreground">
              Link this team to an organization to inherit its governance settings.
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
            form="create-team-form"
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
                <Users className="size-4" />
                Create Team
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

// ─── Success View ─────────────────────────────────────────────────────────────

function SuccessView({ team, onClose }: { team: TeamSummary; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-success/15">
        <CheckCircle2 className="size-7 text-success" />
      </span>

      <h3 className="text-base font-semibold text-foreground">Team created</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{team.name}</span> is ready.
        You're the owner.
      </p>
      {team.organization_name && (
        <p className="mt-1 text-xs text-muted-foreground">
          Linked to{" "}
          <span className="font-medium text-foreground">{team.organization_name}</span>
        </p>
      )}

      <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        <Button variant="ghost" size="default" onClick={onClose}>
          Close
        </Button>
        <Button size="default" className="gap-1.5" asChild>
          <a href={`/teams/${team.id}`}>
            Open Team
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
