"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Settings,
  Info,
  Shield,
  Crown,
  Calendar,
  Users,
  ListTodo,
  Building2,
  Lock,
  Save,
  Trash2,
  ArrowRightLeft,
  Archive,
  ArchiveRestore,
  GitMerge,
  RefreshCw,
  AlertCircle,
  LogOut,
  Pencil,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner, FormErrorBanner } from "@/features/shared/members/member-ui";
import { ConfirmDialog } from "@/features/shared/confirm-dialog";
import { ProjectStatusBadge } from "@/features/shared/project-status-badge";
import {
  SettingsSection,
  SettingsRow,
  InfoRow,
  InlineBanner,
  RolePermRow,
  GovernanceRow,
  InheritanceBadge,
} from "@/features/shared/settings/settings-ui";
import { ProjectRoleBadge } from "./project-role-badge";
import { ProjectRolePermissionsEditModal } from "./role-permissions-edit-modal";
import {
  ALL_PROJECT_STATUSES,
  PROJECT_STATUS_META,
  type ProjectSummary,
  type ProjectRole,
  type ProjectStatus,
  type ProjectSettings,
  type ProjectMembership,
} from "@/lib/projects/types";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Statuses an owner can pick from the General form. ARCHIVED is managed via the Danger Zone. */
const EDITABLE_STATUSES = ALL_PROJECT_STATUSES.filter((s) => s !== "ARCHIVED");

// ─── Types ────────────────────────────────────────────────────────────────────

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved" }
  | { status: "error"; message: string };

type TaskCountState =
  | { status: "loading" }
  | { status: "success"; count: number }
  | { status: "error" };

type GovernanceState =
  | { status: "loading" }
  | { status: "success"; settings: ProjectSettings }
  | { status: "forbidden" }
  | { status: "error"; message: string };

type MembersState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; members: ProjectMembership[] }
  | { status: "error" };

export type ProjectSettingsTabProps = {
  project: ProjectSummary;
  currentUserRole: ProjectRole;
  onTransferOwnership: (member: ProjectMembership) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectSettingsTab({
  project,
  currentUserRole,
  onTransferOwnership,
}: ProjectSettingsTabProps) {
  const router = useRouter();
  const isOwner = currentUserRole === "OWNER";
  const isArchived = project.status === "ARCHIVED";

  // ── General form state ──────────────────────────────────────────────────────
  const [name, setName] = React.useState(project.name);
  const [description, setDescription] = React.useState(project.description ?? "");
  const [status, setStatus] = React.useState<ProjectStatus>(project.status);
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [saveState, setSaveState] = React.useState<SaveState>({ status: "idle" });

  // Keep local form state in sync when the server-rendered project changes
  // (e.g. after an archive/unarchive or rename from the Danger Zone).
  React.useEffect(() => {
    setName(project.name);
    setDescription(project.description ?? "");
    setStatus(project.status);
  }, [project.name, project.description, project.status]);

  const nameDirty = name.trim() !== project.name;
  const descDirty = description.trim() !== (project.description ?? "");
  const statusDirty = status !== project.status;
  const isDirty = nameDirty || descDirty || statusDirty;

  const createdDate = new Date(project.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  // ── Task count ────────────────────────────────────────────────────────────
  const [taskCountState, setTaskCountState] = React.useState<TaskCountState>({ status: "loading" });

  React.useEffect(() => {
    let cancelled = false;
    async function fetchCount() {
      try {
        const res = await fetch(`/api/projects/${project.id}/tasks?page_size=1`);
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) setTaskCountState({ status: "success", count: data.count ?? 0 });
        else setTaskCountState({ status: "error" });
      } catch {
        if (!cancelled) setTaskCountState({ status: "error" });
      }
    }
    fetchCount();
    return () => { cancelled = true; };
  }, [project.id]);

  // ── Governance settings (OWNER only) ────────────────────────────────────────
  const [governanceState, setGovernanceState] = React.useState<GovernanceState>(
    isOwner ? { status: "loading" } : { status: "forbidden" },
  );

  const fetchGovernance = React.useCallback(async () => {
    if (!isOwner) return;
    setGovernanceState({ status: "loading" });
    try {
      const res = await fetch(`/api/projects/${project.id}/settings`);
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) { setGovernanceState({ status: "forbidden" }); return; }
        setGovernanceState({ status: "error", message: data.message ?? "Failed to load governance settings." });
        return;
      }
      setGovernanceState({ status: "success", settings: data as ProjectSettings });
    } catch {
      setGovernanceState({ status: "error", message: "Network error. Please try again." });
    }
  }, [project.id, isOwner]);

  React.useEffect(() => { fetchGovernance(); }, [fetchGovernance]);

  // ── Role permissions editor (OWNER only) ────────────────────────────────────
  const [rolePermsOpen, setRolePermsOpen] = React.useState(false);

  // ── Members (OWNER only — for Transfer Ownership) ───────────────────────────
  const [membersState, setMembersState] = React.useState<MembersState>({ status: "idle" });
  const [transferSelection, setTransferSelection] = React.useState("");

  React.useEffect(() => {
    if (!isOwner) return;
    let cancelled = false;
    async function fetchMembers() {
      setMembersState({ status: "loading" });
      try {
        const params = new URLSearchParams({ page_size: "100", ordering: "user_email" });
        const res = await fetch(`/api/projects/${project.id}/members?${params.toString()}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) { setMembersState({ status: "error" }); return; }
        const members: ProjectMembership[] = data.results?.data ?? [];
        setMembersState({ status: "success", members: members.filter((m) => m.role !== "OWNER") });
      } catch {
        if (!cancelled) setMembersState({ status: "error" });
      }
    }
    fetchMembers();
    return () => { cancelled = true; };
  }, [project.id, isOwner]);

  // ── Danger zone — archive / unarchive ───────────────────────────────────────
  const [archiveOpen, setArchiveOpen] = React.useState(false);
  const [archiving, setArchiving] = React.useState(false);
  const [archiveError, setArchiveError] = React.useState<string | null>(null);

  // ── Danger zone — delete ─────────────────────────────────────────────────────
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // ── Leave project (non-owners only — the backend blocks the owner) ─────────
  const [leaveOpen, setLeaveOpen] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false);
  const [leaveError, setLeaveError] = React.useState<string | null>(null);

  async function handleLeave() {
    setLeaving(true);
    setLeaveError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/leave`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setLeaveError(data.message ?? "Failed to leave project.");
        setLeaving(false);
        return;
      }
      setLeaveOpen(false);
      router.push("/projects");
      router.refresh();
    } catch {
      setLeaveError("Network error. Please try again.");
      setLeaving(false);
    }
  }

  // ── Save general ──────────────────────────────────────────────────────────

  async function handleSaveGeneral(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) { setNameError("Project name is required."); return; }
    if (trimmedName.length > 255) { setNameError("Max 255 characters."); return; }

    setSaveState({ status: "saving" });
    try {
      const body: Record<string, string> = {};
      if (nameDirty) body.name = trimmedName;
      if (descDirty) body.description = description.trim();
      if (statusDirty) body.status = status;

      const res = await fetch(`/api/projects/${project.id}`, {
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

  // ── Archive / unarchive ──────────────────────────────────────────────────────

  async function handleArchiveToggle() {
    setArchiving(true);
    setArchiveError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: isArchived ? "ACTIVE" : "ARCHIVED" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setArchiveError(data.message ?? "Failed to update project status.");
        setArchiving(false);
        return;
      }
      setArchiveOpen(false);
      setArchiving(false);
      router.refresh();
    } catch {
      setArchiveError("Network error. Please try again.");
      setArchiving(false);
    }
  }

  // ── Delete project ────────────────────────────────────────────────────────

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.message ?? "Failed to delete project.");
        setDeleting(false);
        return;
      }
      setDeleteOpen(false);
      router.push("/projects");
      router.refresh();
    } catch {
      setDeleteError("Network error. Please try again.");
      setDeleting(false);
    }
  }

  // ── Transfer ownership ──────────────────────────────────────────────────────

  const transferCandidates = membersState.status === "success" ? membersState.members : [];

  function handleTransferClick() {
    const member = transferCandidates.find((m) => m.user_email === transferSelection);
    if (member) onTransferOwnership(member);
  }

  const taskCountDisplay =
    taskCountState.status === "success" ? String(taskCountState.count)
    : taskCountState.status === "error" ? "—"
    : "…";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {!isOwner && (
        <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" />
          Only the project owner can edit these settings.
        </div>
      )}

      <div className="space-y-6">
        {/* ── General ── */}
        <SettingsSection icon={Settings} title="General" description="Project name, description, and status.">
          <form onSubmit={handleSaveGeneral} noValidate>
            <div className="space-y-4 p-5">
              {saveState.status === "error" && (
                <InlineBanner type="error" message={saveState.message} />
              )}
              {saveState.status === "saved" && (
                <InlineBanner type="success" message="Project updated successfully." />
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="project-name-setting">
                  Project name
                  {isOwner && <span className="ml-0.5 text-destructive">*</span>}
                </Label>
                <Input
                  id="project-name-setting"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setNameError(null); }}
                  disabled={!isOwner || saveState.status === "saving"}
                  readOnly={!isOwner}
                  maxLength={255}
                  className={cn("h-10", !isOwner && "cursor-default opacity-70", nameError && "border-destructive")}
                />
                <div className="min-h-[1rem]">
                  {nameError && (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="size-3" />{nameError}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="project-desc-setting">Description</Label>
                <textarea
                  id="project-desc-setting"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!isOwner || saveState.status === "saving"}
                  readOnly={!isOwner}
                  rows={3}
                  maxLength={500}
                  placeholder={isOwner ? "Describe what this project is for…" : "No description."}
                  className={cn(
                    "w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 transition-colors",
                    !isOwner && "cursor-default opacity-70",
                  )}
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label htmlFor="project-status-setting">Status</Label>
                {isArchived ? (
                  <div className="flex items-center gap-2.5">
                    <ProjectStatusBadge status="ARCHIVED" />
                    <p className="text-xs text-muted-foreground">
                      Unarchive this project from the Danger Zone to change its status.
                    </p>
                  </div>
                ) : isOwner ? (
                  <select
                    id="project-status-setting"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                    disabled={saveState.status === "saving"}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 transition-colors appearance-none"
                  >
                    {EDITABLE_STATUSES.map((s) => (
                      <option key={s} value={s}>{PROJECT_STATUS_META[s].label}</option>
                    ))}
                  </select>
                ) : (
                  <ProjectStatusBadge status={project.status} />
                )}
              </div>
            </div>

            {isOwner && (
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

          <div className="divide-y divide-border/60 border-t border-border">
            <SettingsRow label="Organization">
              {project.organization && project.organization_name ? (
                <Link
                  href={`/organizations/${project.organization}`}
                  prefetch={false}
                  className="flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-primary transition-colors"
                >
                  <Building2 className="size-3.5 text-muted-foreground" />
                  {project.organization_name}
                </Link>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </SettingsRow>
            <SettingsRow label="Team">
              {project.team && project.team_name ? (
                <Link
                  href={`/teams/${project.team}`}
                  prefetch={false}
                  className="flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-primary transition-colors"
                >
                  <Users className="size-3.5 text-muted-foreground" />
                  {project.team_name}
                </Link>
              ) : (
                <span className="text-xs text-muted-foreground">No team</span>
              )}
            </SettingsRow>
          </div>
        </SettingsSection>

        {/* ── Project Information ── */}
        <SettingsSection icon={Info} title="Project Information" description="Read-only project metadata.">
          <div className="divide-y divide-border/60">
            <InfoRow icon={Crown} label="Created by" value={project.created_by_email} truncate />
            <InfoRow icon={Calendar} label="Created" value={createdDate} />
            <InfoRow icon={Users} label="Members" value={String(project.member_count)} />
            <InfoRow icon={ListTodo} label="Tasks" value={taskCountDisplay} />
          </div>
        </SettingsSection>

        {/* ── Governance Preview ── */}
        <SettingsSection icon={Shield} title="Governance Preview" description="Role restrictions, approval rules, and inheritance for this project.">
          {!isOwner ? (
            <div className="flex items-center gap-2.5 px-5 py-4 text-sm text-muted-foreground">
              <Lock className="size-4 shrink-0" />
              Governance details are only visible to the project owner.
            </div>
          ) : governanceState.status === "loading" ? (
            <div className="space-y-3 p-5 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-muted" />
              ))}
            </div>
          ) : governanceState.status === "forbidden" ? (
            <div className="flex items-center gap-2.5 px-5 py-4 text-sm text-muted-foreground">
              <Lock className="size-4 shrink-0" />
              Governance details are only visible to the project owner.
            </div>
          ) : governanceState.status === "error" ? (
            <div className="space-y-3 p-5">
              <InlineBanner type="error" message={governanceState.message} />
              <button
                onClick={fetchGovernance}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline underline-offset-4"
              >
                <RefreshCw className="size-3" />
                Try again
              </button>
            </div>
          ) : (
            <GovernancePreview
              project={project}
              settings={governanceState.settings}
              onEditRolePermissions={() => setRolePermsOpen(true)}
            />
          )}
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
              {/* Transfer ownership */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Transfer ownership</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Make another member the owner. You will become a manager.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {transferCandidates.length > 0 ? (
                    <>
                      <select
                        value={transferSelection}
                        onChange={(e) => setTransferSelection(e.target.value)}
                        className="h-9 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors appearance-none"
                      >
                        <option value="">Select member…</option>
                        {transferCandidates.map((m) => (
                          <option key={m.user} value={m.user_email}>{m.user_email}</option>
                        ))}
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={!transferSelection}
                        onClick={handleTransferClick}
                      >
                        <ArrowRightLeft className="size-3.5" />
                        Transfer
                      </Button>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {membersState.status === "loading" ? "Loading members…" : "Invite another member to transfer ownership."}
                    </p>
                  )}
                </div>
              </div>

              {/* Archive / unarchive */}
              <div className="flex items-center justify-between gap-4 pt-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {isArchived ? "Unarchive this project" : "Archive this project"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {isArchived
                      ? "Restore this project to active status."
                      : "Hide this project from active views. It can be restored later."}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={() => { setArchiveError(null); setArchiveOpen(true); }}
                >
                  {isArchived ? <ArchiveRestore className="size-3.5" /> : <Archive className="size-3.5" />}
                  {isArchived ? "Unarchive" : "Archive"}
                </Button>
              </div>

              {/* Delete project */}
              <div className="flex items-center justify-between gap-4 pt-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Delete this project</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Permanently deletes the project and all its tasks. This cannot be undone.
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

        {/* ── Leave project (non-owners only) ── */}
        {!isOwner && (
          <div className="rounded-xl border border-destructive/30 bg-card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-destructive/20 bg-destructive/5 px-5 py-4">
              <LogOut className="size-4 text-destructive" />
              <div>
                <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-medium text-foreground">Leave this project</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  You will lose access to this project immediately.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={() => { setLeaveError(null); setLeaveOpen(true); }}
              >
                <LogOut className="size-3.5" />
                Leave
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Archive confirm dialog ── */}
      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={(open) => { if (!archiving) setArchiveOpen(open); }}
        title={isArchived ? "Unarchive this project?" : "Archive this project?"}
        description={
          isArchived ? (
            <>
              This will restore{" "}
              <span className="font-semibold text-foreground">{project.name}</span> to active status.
            </>
          ) : (
            <>
              This will archive{" "}
              <span className="font-semibold text-foreground">{project.name}</span>. It will be
              hidden from active project views until unarchived.
            </>
          )
        }
        detail={archiveError ? <FormErrorBanner message={archiveError} /> : undefined}
        confirmLabel={isArchived ? "Unarchive" : "Archive"}
        variant={isArchived ? "default" : "warning"}
        icon={isArchived ? "none" : "warning"}
        loading={archiving}
        onConfirm={handleArchiveToggle}
      />

      {/* ── Delete confirm dialog ── */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => { if (!deleting) setDeleteOpen(open); }}
        title="Delete this project?"
        description={
          <>
            This will permanently delete{" "}
            <span className="font-semibold text-foreground">{project.name}</span> and all its
            tasks and member data. This cannot be undone.
          </>
        }
        detail={
          <div className="space-y-3">
            {deleteError && <FormErrorBanner message={deleteError} />}
            <div className="space-y-1.5 rounded-lg border border-warning/20 bg-warning/8 px-3.5 py-3">
              <p className="text-xs font-semibold text-warning">This will permanently delete:</p>
              <ul className="space-y-0.5 text-xs text-warning opacity-90">
                <li>• All tasks in this project</li>
                <li>• All project members and their roles</li>
                <li>• All governance settings and activity logs</li>
              </ul>
            </div>
          </div>
        }
        confirmLabel="Delete Project"
        icon="trash"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />

      {/* ── Leave confirm dialog ── */}
      <ConfirmDialog
        open={leaveOpen}
        onOpenChange={(open) => { if (!leaving) setLeaveOpen(open); }}
        title="Leave this project?"
        description={
          <>
            You will lose access to{" "}
            <span className="font-semibold text-foreground">{project.name}</span> immediately.
          </>
        }
        detail={leaveError ? <FormErrorBanner message={leaveError} /> : undefined}
        confirmLabel="Leave"
        icon="user-minus"
        variant="destructive"
        loading={leaving}
        onConfirm={handleLeave}
      />

      {/* ── Role permissions editor ── */}
      {governanceState.status === "success" && (
        <ProjectRolePermissionsEditModal
          open={rolePermsOpen}
          projectId={project.id}
          settings={governanceState.settings}
          onClose={() => setRolePermsOpen(false)}
          onSaved={(updated) => {
            setRolePermsOpen(false);
            setGovernanceState({ status: "success", settings: updated });
          }}
        />
      )}
    </div>
  );
}

// ─── Governance Preview content ────────────────────────────────────────────────

function GovernancePreview({
  project,
  settings,
  onEditRolePermissions,
}: {
  project: ProjectSummary;
  settings: ProjectSettings;
  onEditRolePermissions: () => void;
}) {
  return (
    <div className="divide-y divide-border/60">
      {/* Inheritance indicators */}
      {(project.team || project.organization) && (
        <div className="space-y-2 px-5 py-4">
          {project.team && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <GitMerge className="size-3.5 shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Inherit rules from team</p>
              </div>
              <InheritanceBadge enabled={settings.inherit_base_rules_from_team} />
            </div>
          )}
          {project.organization && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <GitMerge className="size-3.5 shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Inherit rules from organization</p>
              </div>
              <InheritanceBadge enabled={settings.inherit_base_rules_from_org} />
            </div>
          )}
        </div>
      )}

      {/* Task rules */}
      <div className="px-5 py-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Task rules
          </p>
          <button
            type="button"
            onClick={onEditRolePermissions}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline underline-offset-4"
          >
            <Pencil className="size-3" />
            Edit
          </button>
        </div>
        <div className="space-y-2">
          <RolePermRow label="Create tasks" badge={<ProjectRoleBadge role={settings.create_task_min_role} />} />
          <RolePermRow label="Update tasks" badge={<ProjectRoleBadge role={settings.update_task_min_role} />} />
          <RolePermRow label="Delete tasks" badge={<ProjectRoleBadge role={settings.delete_task_min_role} />} />
        </div>
      </div>

      {/* Invite rules */}
      <div className="px-5 py-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Invite rules
        </p>
        <div className="space-y-2">
          <RolePermRow label="Invite members" badge={<ProjectRoleBadge role={settings.invite_member_min_role} />} />
          <GovernanceRow label="Allow members to invite others" enabled={settings.allow_member_invites} />
          <GovernanceRow label="Require approval for invites" enabled={settings.require_approval_for_invites} />
        </div>
      </div>

      {/* Ownership rules */}
      <div className="px-5 py-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Ownership rules
        </p>
        <div className="space-y-2">
          <RolePermRow label="Update member roles" badge={<ProjectRoleBadge role={settings.update_member_min_role} />} />
          <RolePermRow label="Remove members" badge={<ProjectRoleBadge role={settings.remove_member_min_role} />} />
          <GovernanceRow label="Allow members to remove others" enabled={settings.allow_member_removal} />
          <GovernanceRow label="Allow members to leave the project" enabled={settings.allow_self_removal} />
        </div>
      </div>

      <div className="px-5 py-4">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onEditRolePermissions}
        >
          <Shield className="size-3.5" />
          Edit role permissions
          <ChevronRight className="size-3.5 text-muted-foreground" />
        </Button>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3.5 shrink-0" />
          Approval rules, limits, and invite toggles aren't editable yet — only role minimums.
        </p>
      </div>
    </div>
  );
}
