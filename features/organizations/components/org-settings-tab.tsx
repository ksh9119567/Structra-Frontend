"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Users,
  Shield,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Save,
  Trash2,
  Lock,
  ChevronRight,
  Info,
  Pencil,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrgRoleBadge } from "./org-role-badge";
import { GovernanceEditModal } from "./governance-edit-modal";
import { RolePermissionsEditModal } from "./role-permissions-edit-modal";
import type { OrganizationSummary, OrgSettings, OrgRole } from "@/lib/organizations/types";

// ─── Role hierarchy ───────────────────────────────────────────────────────────

const ROLE_LEVEL: Record<OrgRole, number> = {
  OWNER: 5, ADMIN: 4, MANAGER: 3, MEMBER: 2, VIEWER: 1,
};

const EDITABLE_ROLES: OrgRole[] = ["ADMIN", "MANAGER", "MEMBER", "VIEWER"];

// ─── Types ────────────────────────────────────────────────────────────────────

type FetchState =
  | { status: "loading" }
  | { status: "success"; settings: OrgSettings }
  | { status: "error"; message: string };

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved" }
  | { status: "error"; message: string };

type DeleteState =
  | { status: "idle" }
  | { status: "confirming" }
  | { status: "deleting" }
  | { status: "error"; message: string };

type OrgSettingsTabProps = {
  org: OrganizationSummary;
  currentUserRole: OrgRole;
  /** When set to "delete", the danger-zone delete confirmation opens on mount. */
  initialAction?: "delete" | null;
  /** Called once the initial action has been applied, so it fires only once. */
  onInitialActionConsumed?: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function OrgSettingsTab({
  org,
  currentUserRole,
  initialAction,
  onInitialActionConsumed,
}: OrgSettingsTabProps) {
  const [fetchState, setFetchState] = React.useState<FetchState>({ status: "loading" });

  const canEdit = ROLE_LEVEL[currentUserRole] >= ROLE_LEVEL.ADMIN;
  const isOwner = currentUserRole === "OWNER";

  const fetchSettings = React.useCallback(async () => {
    setFetchState({ status: "loading" });
    try {
      const res = await fetch(`/api/organizations/${org.id}/settings`);
      const data = await res.json();
      if (!res.ok) {
        setFetchState({ status: "error", message: data.message ?? "Failed to load settings." });
        return;
      }
      setFetchState({ status: "success", settings: data as OrgSettings });
    } catch {
      setFetchState({ status: "error", message: "Network error. Please try again." });
    }
  }, [org.id]);

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
      org={org}
      settings={fetchState.settings}
      canEdit={canEdit}
      isOwner={isOwner}
      initialAction={initialAction}
      onInitialActionConsumed={onInitialActionConsumed}
      onSettingsUpdated={(updated) =>
        setFetchState({ status: "success", settings: updated })
      }
    />
  );
}

// ─── Settings Form ────────────────────────────────────────────────────────────

function SettingsForm({
  org,
  settings,
  canEdit,
  isOwner,
  initialAction,
  onInitialActionConsumed,
  onSettingsUpdated,
}: {
  org: OrganizationSummary;
  settings: OrgSettings;
  canEdit: boolean;
  isOwner: boolean;
  initialAction?: "delete" | null;
  onInitialActionConsumed?: () => void;
  onSettingsUpdated: (s: OrgSettings) => void;
}) {
  const router = useRouter();

  // Local editable state — mirrors settings
  const [orgName, setOrgName] = React.useState(org.name);
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [saveState, setSaveState] = React.useState<SaveState>({ status: "idle" });

  // Governance editor
  const [governanceOpen, setGovernanceOpen] = React.useState(false);

  // Role permissions editor
  const [rolePermsOpen, setRolePermsOpen] = React.useState(false);

  // Delete zone
  const [deleteState, setDeleteState] = React.useState<DeleteState>({ status: "idle" });
  const [deleteConfirm, setDeleteConfirm] = React.useState("");
  const deleteInputRef = React.useRef<HTMLInputElement>(null);

  const nameDirty = orgName.trim() !== org.name;
  const deleteMatches = deleteConfirm.trim() === org.name.trim();

  // Auto-open the delete confirmation when navigated here from the overview
  // "Delete organization" button.
  React.useEffect(() => {
    if (initialAction === "delete" && isOwner) {
      setDeleteState({ status: "confirming" });
      setDeleteConfirm("");
      setTimeout(() => deleteInputRef.current?.focus(), 120);
    }
    if (initialAction) onInitialActionConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAction, isOwner]);

  // ── Save name ──────────────────────────────────────────────────────────────

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = orgName.trim();
    if (!trimmed) { setNameError("Name is required."); return; }
    if (trimmed.length > 255) { setNameError("Max 255 characters."); return; }

    setSaveState({ status: "saving" });
    try {
      const res = await fetch(`/api/organizations/${org.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
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

  // ── Delete org ─────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteMatches) return;
    setDeleteState({ status: "deleting" });
    try {
      const res = await fetch(`/api/organizations/${org.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setDeleteState({ status: "error", message: data.message ?? "Failed to delete." });
        return;
      }
      router.push("/organizations");
      router.refresh();
    } catch {
      setDeleteState({ status: "error", message: "Network error." });
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Read-only banner for non-editors */}
      {!canEdit && (
        <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" />
          You have read-only access to these settings.
        </div>
      )}

      <div className="space-y-6">
        {/* ── General ── */}
        <SettingsSection
          icon={Settings}
          title="General"
          description="Basic organization information."
        >
          <form onSubmit={handleSaveName} noValidate>
            <div className="space-y-4 p-5">
              {saveState.status === "error" && (
                <InlineBanner type="error" message={saveState.message} />
              )}
              {saveState.status === "saved" && (
                <InlineBanner type="success" message="Organization name updated." />
              )}

              <div className="space-y-1.5">
                <Label htmlFor="org-name-setting">
                  Organization name
                  {canEdit && <span className="ml-0.5 text-destructive">*</span>}
                </Label>
                <Input
                  id="org-name-setting"
                  value={orgName}
                  onChange={(e) => { setOrgName(e.target.value); setNameError(null); }}
                  disabled={!canEdit || saveState.status === "saving"}
                  readOnly={!canEdit}
                  maxLength={255}
                  className={cn(
                    "h-10",
                    !canEdit && "cursor-default opacity-70",
                    nameError && "border-destructive",
                  )}
                />
                <div className="min-h-[1rem]">
                  {nameError ? (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="size-3" />{nameError}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Must be unique across Structra.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {canEdit && (
              <div className="flex items-center justify-between border-t border-border px-5 py-3.5">
                <p className="text-xs text-muted-foreground">
                  {nameDirty ? "Unsaved changes" : "No changes"}
                </p>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!nameDirty || saveState.status === "saving"}
                  className="gap-1.5"
                >
                  {saveState.status === "saving" ? (
                    <><Spinner />Saving…</>
                  ) : (
                    <><Save className="size-3.5" />Save name</>
                  )}
                </Button>
              </div>
            )}
          </form>
        </SettingsSection>

        {/* ── Membership ── */}
        <SettingsSection
          icon={Users}
          title="Membership"
          description="Member counts, limits, and role defaults."
        >
          <div className="divide-y divide-border/60">
            {/* Counts */}
            <div className="grid grid-cols-3 divide-x divide-border/60 px-0">
              <StatCell label="Members" value={org.member_count} max={settings.max_members} />
              <StatCell label="Teams" value={org.team_count} max={settings.max_teams} />
              <StatCell label="Projects" value={org.project_count} max={settings.max_projects} />
            </div>

            {/* Default role */}
            <SettingsRow
              label="Default member role"
              description="Role assigned to new members on join"
            >
              <OrgRoleBadge role={settings.default_member_role} />
            </SettingsRow>

            {/* Role summary */}
            <div className="px-5 py-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Role permissions
                </p>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setRolePermsOpen(true)}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:underline underline-offset-4"
                  >
                    <Pencil className="size-3" />
                    Edit
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <RolePermRow label="Invite members" role={settings.invite_member_min_role} />
                <RolePermRow label="Update members" role={settings.update_member_min_role} />
                <RolePermRow label="Remove members" role={settings.remove_member_min_role} />
                <RolePermRow label="Create teams" role={settings.create_team_min_role} />
                <RolePermRow label="Create projects" role={settings.create_project_min_role} />
              </div>
              {!canEdit && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Info className="size-3.5" />
                  Role permissions can only be changed by Admins and above.
                </p>
              )}
            </div>
          </div>
        </SettingsSection>

        {/* ── Governance ── */}
        <SettingsSection
          icon={Shield}
          title="Governance"
          description="Approval rules, creation controls, and restrictions."
        >
          <div className="divide-y divide-border/60">
            {/* Approval rules */}
            <div className="px-5 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Approval rules
              </p>
              <div className="space-y-2">
                <GovernanceRow
                  label="Require approval for member invites"
                  enabled={settings.require_approval_for_invites}
                />
                <GovernanceRow
                  label="Require approval for member updates"
                  enabled={settings.require_approval_for_updates}
                />
                <GovernanceRow
                  label="Require approval for member removal"
                  enabled={settings.require_approval_for_removal}
                />
                <GovernanceRow
                  label="Require approval for team creation"
                  enabled={settings.require_approval_for_team}
                />
                <GovernanceRow
                  label="Require approval for project creation"
                  enabled={settings.require_approval_for_project}
                />
              </div>
            </div>

            {/* Creation controls */}
            <div className="px-5 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Creation controls
              </p>
              <div className="space-y-2">
                <GovernanceRow
                  label="Allow team creation by non-owners"
                  enabled={settings.allow_team_creation}
                />
                <GovernanceRow
                  label="Allow project creation by non-owners"
                  enabled={settings.allow_project_creation}
                />
              </div>
            </div>

            {/* Membership rules */}
            <div className="px-5 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Membership rules
              </p>
              <div className="space-y-2">
                <GovernanceRow
                  label="Allow members to invite others"
                  enabled={settings.allow_member_invites}
                />
                <GovernanceRow
                  label="Allow members to update others"
                  enabled={settings.allow_member_updates}
                />
                <GovernanceRow
                  label="Allow members to remove others"
                  enabled={settings.allow_member_removal}
                />
                <GovernanceRow
                  label="Allow members to leave the organization"
                  enabled={settings.allow_self_removal}
                />
              </div>
            </div>

            {canEdit && (
              <div className="px-5 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setGovernanceOpen(true)}
                >
                  <Settings className="size-3.5" />
                  Edit governance settings
                  <ChevronRight className="size-3.5 text-muted-foreground" />
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  Update approval, creation, and membership rules for this organization.
                </p>
              </div>
            )}
          </div>
        </SettingsSection>

        {/* ── Danger Zone ── */}
        {isOwner && (
          <div className="rounded-xl border border-destructive/30 bg-card">
            <div className="flex items-center gap-3 border-b border-destructive/20 bg-destructive/5 px-5 py-4">
              <Trash2 className="size-4 text-destructive" />
              <div>
                <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
                <p className="text-xs text-muted-foreground">
                  Irreversible actions. Proceed with extreme caution.
                </p>
              </div>
            </div>

            <div className="p-5">
              {deleteState.status === "error" && (
                <div className="mb-4">
                  <InlineBanner type="error" message={deleteState.message} />
                </div>
              )}

              {deleteState.status !== "confirming" && deleteState.status !== "deleting" ? (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Delete this organization
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Permanently deletes the organization, all teams, projects, and tasks.
                      This cannot be undone.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="shrink-0 gap-1.5"
                    onClick={() => {
                      setDeleteState({ status: "confirming" });
                      setDeleteConfirm("");
                      setTimeout(() => deleteInputRef.current?.focus(), 80);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Consequence warning */}
                  <div className="flex items-start gap-2.5 rounded-lg border border-warning/20 bg-warning/8 px-3.5 py-3">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                    <div className="text-xs text-warning">
                      <p className="font-semibold">This will permanently delete:</p>
                      <ul className="mt-1 space-y-0.5 opacity-90">
                        <li>• All teams and their members</li>
                        <li>• All projects and their tasks</li>
                        <li>• All governance settings and activity logs</li>
                      </ul>
                    </div>
                  </div>

                  {/* Confirmation input */}
                  <div className="space-y-1.5">
                    <Label htmlFor="delete-confirm" className="text-sm font-medium text-foreground">
                      Type{" "}
                      <span className="font-mono font-semibold">{org.name}</span>{" "}
                      to confirm deletion
                    </Label>
                    <Input
                      ref={deleteInputRef}
                      id="delete-confirm"
                      type="text"
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      placeholder={org.name}
                      disabled={deleteState.status === "deleting"}
                      autoComplete="off"
                      spellCheck={false}
                      className={cn(
                        "h-10 font-mono",
                        deleteMatches
                          ? "border-destructive focus-visible:ring-destructive/30"
                          : deleteConfirm.length > 0
                            ? "border-destructive/40"
                            : "",
                      )}
                    />
                    <div className="min-h-[1rem]">
                      {deleteConfirm.length > 0 && !deleteMatches ? (
                        <p className="flex items-center gap-1 text-xs text-destructive">
                          <AlertCircle className="size-3" />
                          Name doesn't match.
                        </p>
                      ) : deleteMatches ? (
                        <p className="flex items-center gap-1 text-xs text-destructive font-medium">
                          <AlertTriangle className="size-3" />
                          This will permanently delete the organization.
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Case-sensitive.</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setDeleteState({ status: "idle" }); setDeleteConfirm(""); }}
                      disabled={deleteState.status === "deleting"}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={!deleteMatches || deleteState.status === "deleting"}
                      onClick={handleDelete}
                      className={cn(
                        "gap-1.5",
                        deleteMatches
                          ? "bg-destructive text-white hover:bg-destructive/90"
                          : "",
                      )}
                    >
                      {deleteState.status === "deleting" ? (
                        <><Spinner />Deleting…</>
                      ) : (
                        <><Trash2 className="size-3.5" />Delete organization</>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Governance editor ── */}
      <GovernanceEditModal
        open={governanceOpen}
        orgId={org.id}
        settings={settings}
        onClose={() => setGovernanceOpen(false)}
        onSaved={(updated) => {
          setGovernanceOpen(false);
          onSettingsUpdated(updated);
        }}
      />

      {/* ── Role permissions editor ── */}
      <RolePermissionsEditModal
        open={rolePermsOpen}
        orgId={org.id}
        settings={settings}
        onClose={() => setRolePermsOpen(false)}
        onSaved={(updated) => {
          setRolePermsOpen(false);
          onSettingsUpdated(updated);
        }}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
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
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
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
      {/* Mini progress bar */}
      <div className="mt-1 h-1 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", isNearLimit ? "bg-warning" : "bg-primary/50")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function RolePermRow({ label, role }: { label: string; role: OrgRole }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-3.5 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>min.</span>
        <OrgRoleBadge role={role} />
      </div>
    </div>
  );
}

function GovernanceRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-3.5 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
          enabled
            ? "bg-success/15 text-success"
            : "bg-muted text-muted-foreground",
        )}
      >
        <span className={cn("size-1.5 rounded-full", enabled ? "bg-success" : "bg-muted-foreground/50")} />
        {enabled ? "Enabled" : "Disabled"}
      </span>
    </div>
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

// ─── Loading skeleton ─────────────────────────────────────────────────────────

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

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-14 text-center">
      <AlertCircle className="mb-3 size-7 text-destructive" />
      <p className="text-sm font-medium text-foreground">Failed to load settings</p>
      <p className="mt-1 text-xs text-muted-foreground">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline underline-offset-4"
      >
        <RefreshCw className="size-3" />
        Try again
      </button>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
