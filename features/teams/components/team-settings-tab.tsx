"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Users,
  Shield,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Save,
  Trash2,
  Lock,
  Crown,
  Building2,
  Calendar,
  Info,
  GitMerge,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TeamRoleBadge } from "./team-role-badge";
import { ConfirmDialog } from "@/features/shared/confirm-dialog";
import type { TeamSummary, TeamSettings, TeamRole } from "@/lib/teams/types";

// ─── Role hierarchy ───────────────────────────────────────────────────────────

const ROLE_LEVEL: Record<TeamRole, number> = {
  OWNER: 5, MANAGER: 4, LEAD: 3, MEMBER: 2, VIEWER: 1,
};

// ─── Types ────────────────────────────────────────────────────────────────────

type FetchState =
  | { status: "loading" }
  | { status: "success"; settings: TeamSettings }
  | { status: "error"; message: string };

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved" }
  | { status: "error"; message: string };

export type TeamSettingsTabProps = {
  team: TeamSummary;
  currentUserRole: TeamRole;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function TeamSettingsTab({ team, currentUserRole }: TeamSettingsTabProps) {
  const [fetchState, setFetchState] = React.useState<FetchState>({ status: "loading" });

  const isOwner = currentUserRole === "OWNER";
  const isManagerOrAbove = ROLE_LEVEL[currentUserRole] >= ROLE_LEVEL.MANAGER;

  const fetchSettings = React.useCallback(async () => {
    setFetchState({ status: "loading" });
    try {
      const res = await fetch(`/api/teams/${team.id}/settings`);
      const data = await res.json();
      if (!res.ok) {
        setFetchState({ status: "error", message: data.message ?? "Failed to load settings." });
        return;
      }
      setFetchState({ status: "success", settings: data as TeamSettings });
    } catch {
      setFetchState({ status: "error", message: "Network error. Please try again." });
    }
  }, [team.id]);

  React.useEffect(() => { fetchSettings(); }, [fetchSettings]);

  if (fetchState.status === "loading") return <SettingsSkeleton />;

  if (fetchState.status === "error") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <ErrorState message={fetchState.message} onRetry={fetchSettings} />
      </div>
    );
  }

  return (
    <SettingsForm
      team={team}
      settings={fetchState.settings}
      isOwner={isOwner}
      isManagerOrAbove={isManagerOrAbove}
      onSettingsUpdated={(updated) =>
        setFetchState({ status: "success", settings: updated })
      }
    />
  );
}

// ─── Settings Form ────────────────────────────────────────────────────────────

function SettingsForm({
  team,
  settings,
  isOwner,
  isManagerOrAbove,
  onSettingsUpdated,
}: {
  team: TeamSummary;
  settings: TeamSettings;
  isOwner: boolean;
  isManagerOrAbove: boolean;
  onSettingsUpdated: (s: TeamSettings) => void;
}) {
  const router = useRouter();

  // General form state
  const [teamName, setTeamName] = React.useState(team.name);
  const [teamDescription, setTeamDescription] = React.useState(team.description ?? "");
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [saveState, setSaveState] = React.useState<SaveState>({ status: "idle" });

  // Danger zone — delete
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const nameDirty = teamName.trim() !== team.name;
  const descDirty = teamDescription.trim() !== (team.description ?? "");
  const isDirty = nameDirty || descDirty;

  const createdDate = new Date(team.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  // ── Save general ──────────────────────────────────────────────────────────

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = teamName.trim();
    if (!trimmedName) { setNameError("Team name is required."); return; }
    if (trimmedName.length > 255) { setNameError("Max 255 characters."); return; }

    setSaveState({ status: "saving" });
    try {
      const body: Record<string, string> = { name: trimmedName };
      if (descDirty) body.description = teamDescription.trim();

      const res = await fetch(`/api/teams/${team.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.field === "name") { setNameError(data.message); setSaveState({ status: "idle" }); return; }
        setSaveState({ status: "error", message: data.message ?? "Failed to save." });
        return;
      }
      setSaveState({ status: "saved" });
      router.refresh();
      setTimeout(() => setSaveState({ status: "idle" }), 3000);
    } catch {
      setSaveState({ status: "error", message: "Network error." });
    }
  }

  // ── Delete team ───────────────────────────────────────────────────────────

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/teams/${team.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.message ?? "Failed to delete team.");
        setDeleting(false);
        return;
      }
      setDeleteOpen(false);
      router.push("/teams");
      router.refresh();
    } catch {
      setDeleteError("Network error. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {!isManagerOrAbove && (
        <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" />
          You have read-only access to these settings.
        </div>
      )}

      <div className="space-y-6">
        {/* ── General ── */}
        <SettingsSection icon={Settings} title="General" description="Team name and description.">
          <form onSubmit={handleSave} noValidate>
            <div className="space-y-4 p-5">
              {saveState.status === "error" && (
                <InlineBanner type="error" message={saveState.message} />
              )}
              {saveState.status === "saved" && (
                <InlineBanner type="success" message="Team updated successfully." />
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="team-name-setting">
                  Team name
                  {isManagerOrAbove && <span className="ml-0.5 text-destructive">*</span>}
                </Label>
                <Input
                  id="team-name-setting"
                  value={teamName}
                  onChange={(e) => { setTeamName(e.target.value); setNameError(null); }}
                  disabled={!isManagerOrAbove || saveState.status === "saving"}
                  readOnly={!isManagerOrAbove}
                  maxLength={255}
                  className={cn("h-10", !isManagerOrAbove && "cursor-default opacity-70", nameError && "border-destructive")}
                />
                <div className="min-h-[1rem]">
                  {nameError ? (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="size-3" />{nameError}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Must be unique across Structra.</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="team-desc-setting">Description</Label>
                <textarea
                  id="team-desc-setting"
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  disabled={!isManagerOrAbove || saveState.status === "saving"}
                  readOnly={!isManagerOrAbove}
                  rows={3}
                  maxLength={500}
                  placeholder={isManagerOrAbove ? "Describe what this team works on…" : "No description."}
                  className={cn(
                    "w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 transition-colors",
                    !isManagerOrAbove && "cursor-default opacity-70",
                  )}
                />
              </div>
            </div>

            {isManagerOrAbove && (
              <div className="flex items-center justify-between border-t border-border px-5 py-3.5">
                <p className="text-xs text-muted-foreground">
                  {isDirty ? "Unsaved changes" : "No changes"}
                </p>
                <Button type="submit" size="sm" disabled={!isDirty || saveState.status === "saving"} className="gap-1.5">
                  {saveState.status === "saving" ? <><Spinner />Saving…</> : <><Save className="size-3.5" />Save changes</>}
                </Button>
              </div>
            )}
          </form>
        </SettingsSection>

        {/* ── Team Information ── */}
        <SettingsSection icon={Info} title="Team Information" description="Read-only team metadata.">
          <div className="divide-y divide-border/60">
            {team.organization && team.organization_name && (
              <InfoRow icon={Building2} label="Organization" value={team.organization_name} />
            )}
            <InfoRow icon={Crown} label="Owner" value={team.created_by_email} truncate />
            <InfoRow icon={Users} label="Created by" value={team.created_by_email} truncate />
            <InfoRow icon={Calendar} label="Created" value={createdDate} />
            <div className="grid grid-cols-2 divide-x divide-border/60">
              <StatCell label="Members" value={team.member_count} max={settings.max_members} />
              <StatCell label="Projects" value={team.project_count} max={settings.max_projects} />
            </div>
            <SettingsRow label="Default member role" description="Role assigned to new members on join">
              <TeamRoleBadge role={settings.default_member_role} />
            </SettingsRow>
          </div>
        </SettingsSection>

        {/* ── Governance Preview ── */}
        <SettingsSection icon={Shield} title="Governance" description="Role restrictions, approval rules, and inheritance.">
          <div className="divide-y divide-border/60">

            {/* Inheritance */}
            {team.organization && (
              <div className="px-5 py-4">
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <GitMerge className="size-3.5 shrink-0 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Inherit rules from organization</p>
                  </div>
                  <InheritanceBadge enabled={settings.inherit_base_rules_from_org} />
                </div>
              </div>
            )}

            {/* Role permissions */}
            <div className="px-5 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Role permissions
              </p>
              <div className="space-y-2">
                <RolePermRow label="Invite members" role={settings.invite_member_min_role} />
                <RolePermRow label="Update members" role={settings.update_member_min_role} />
                <RolePermRow label="Remove members" role={settings.remove_member_min_role} />
                <RolePermRow label="Create projects" role={settings.create_project_min_role} />
              </div>
            </div>

            {/* Approval rules */}
            <div className="px-5 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Approval rules
              </p>
              <div className="space-y-2">
                <GovernanceRow label="Require approval for member invites" enabled={settings.require_approval_for_invites} />
                <GovernanceRow label="Require approval for member updates" enabled={settings.require_approval_for_updates} />
                <GovernanceRow label="Require approval for member removal" enabled={settings.require_approval_for_removal} />
                <GovernanceRow label="Require approval for project creation" enabled={settings.require_approval_for_project} />
              </div>
            </div>

            {/* Membership rules */}
            <div className="px-5 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Membership rules
              </p>
              <div className="space-y-2">
                <GovernanceRow label="Allow members to invite others" enabled={settings.allow_member_invites} />
                <GovernanceRow label="Allow members to update others" enabled={settings.allow_member_updates} />
                <GovernanceRow label="Allow members to remove others" enabled={settings.allow_member_removal} />
                <GovernanceRow label="Allow members to leave the team" enabled={settings.allow_self_removal} />
                <GovernanceRow label="Allow project creation by non-owners" enabled={settings.allow_project_creation} />
              </div>
            </div>

            {isOwner && (
              <div className="px-5 py-4">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Info className="size-3.5 shrink-0" />
                  Full governance editing will be available in a future update.
                </p>
              </div>
            )}
          </div>
        </SettingsSection>

        {/* ── Danger Zone ── */}
        {isOwner && (
          <div className="rounded-xl border border-destructive/30 bg-card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-destructive/20 bg-destructive/5 px-5 py-4">
              <Trash2 className="size-4 text-destructive" />
              <div>
                <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
                <p className="text-xs text-muted-foreground">Irreversible actions. Proceed with extreme caution.</p>
              </div>
            </div>

            <div className="divide-y divide-border/60 p-5 space-y-4">
              {deleteError && (
                <InlineBanner type="error" message={deleteError} />
              )}

              {/* Delete team */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Delete this team</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Permanently deletes the team, all projects, and tasks. This cannot be undone.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={() => { setDeleteError(null); setDeleteOpen(true); }}
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete confirm dialog ── */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => { if (!deleting) setDeleteOpen(open); }}
        title="Delete this team?"
        description={
          <>
            This will permanently delete{" "}
            <span className="font-semibold text-foreground">{team.name}</span> and all its
            projects, tasks, and member data. This cannot be undone.
          </>
        }
        detail={
          <div className="space-y-1.5 rounded-lg border border-warning/20 bg-warning/8 px-3.5 py-3">
            <p className="text-xs font-semibold text-warning">This will permanently delete:</p>
            <ul className="space-y-0.5 text-xs text-warning opacity-90">
              <li>• All team members and their roles</li>
              <li>• All projects belonging to this team</li>
              <li>• All governance settings and activity logs</li>
            </ul>
          </div>
        }
        confirmLabel="Delete Team"
        icon="trash"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SettingsSection({
  icon: Icon, title, description, children,
}: {
  icon: React.ElementType; title: string; description: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-4 text-primary" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function SettingsRow({
  label, description, children,
}: {
  label: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function InfoRow({
  icon: Icon, label, value, truncate,
}: {
  icon: React.ElementType; label: string; value: string; truncate?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="w-24 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span
        className={cn("flex-1 text-xs font-medium text-foreground text-right", truncate && "truncate")}
        title={truncate ? value : undefined}
      >
        {value}
      </span>
    </div>
  );
}

function StatCell({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const isNearLimit = pct >= 80;
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-4 text-center">
      <p className={cn("text-xl font-bold tabular-nums", isNearLimit ? "text-warning" : "text-foreground")}>
        {value}
        <span className="text-sm font-normal text-muted-foreground">/{max}</span>
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 h-1 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", isNearLimit ? "bg-warning" : "bg-primary/50")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function RolePermRow({ label, role }: { label: string; role: TeamRole }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-3.5 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>min.</span>
        <TeamRoleBadge role={role} />
      </div>
    </div>
  );
}

function GovernanceRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-3.5 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <span className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
        enabled ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
      )}>
        <span className={cn("size-1.5 rounded-full", enabled ? "bg-success" : "bg-muted-foreground/50")} />
        {enabled ? "Enabled" : "Disabled"}
      </span>
    </div>
  );
}

function InheritanceBadge({ enabled }: { enabled: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
      enabled ? "bg-info/15 text-info" : "bg-muted text-muted-foreground",
    )}>
      <span className={cn("size-1.5 rounded-full", enabled ? "bg-info" : "bg-muted-foreground/50")} />
      {enabled ? "Inheriting" : "Not inheriting"}
    </span>
  );
}

function InlineBanner({ type, message }: { type: "success" | "error"; message: string }) {
  const styles = {
    success: "border-success/30 bg-success/10 text-success",
    error: "border-destructive/30 bg-destructive/10 text-destructive",
  };
  const Icon = type === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div className={cn("flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-sm", styles[type])}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 space-y-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <div className="size-8 rounded-lg bg-muted" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-24 rounded bg-muted" />
              <div className="h-3 w-40 rounded bg-muted" />
            </div>
          </div>
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-10 rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-14 text-center">
      <AlertCircle className="mb-3 size-7 text-destructive" />
      <p className="text-sm font-medium text-foreground">Failed to load settings</p>
      <p className="mt-1 text-xs text-muted-foreground">{message}</p>
      <button onClick={onRetry} className="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline underline-offset-4">
        <RefreshCw className="size-3" />
        Try again
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
