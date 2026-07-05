"use client";

import * as React from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ConfirmDialog } from "@/features/shared/confirm-dialog";
import { Spinner, FormErrorBanner } from "@/features/shared/members/member-ui";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskPriorityBadge } from "./task-priority-badge";
import type { ProjectMembership } from "@/lib/projects/types";
import {
  ALL_TASK_STATUSES,
  ALL_TASK_PRIORITIES,
  ALL_TASK_TYPES,
  TASK_STATUS_META,
  TASK_PRIORITY_META,
  TASK_TYPE_META,
  type TaskSummary,
  type TaskStatus,
  type TaskPriority,
  type TaskType,
} from "@/lib/tasks/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type FetchState =
  | { status: "loading" }
  | { status: "success"; task: TaskSummary }
  | { status: "error"; message: string };

type SaveState =
  | { phase: "idle" }
  | { phase: "saving" }
  | { phase: "error"; message: string };

type EditForm = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  task_type: TaskType;
  start_date: string;
  due_date: string;
  assigned_to: string;
};

export type TaskDetailDrawerProps = {
  /** The task to display, or null to keep the drawer closed. */
  taskId: string | null;
  onClose: () => void;
  /** Called after a successful save, with the freshly-updated task. */
  onUpdated?: (task: TaskSummary) => void;
  /** Called after a successful delete, with the deleted task's id. */
  onDeleted?: (taskId: string) => void;
};

// ─── Shared field styling ───────────────────────────────────────────────────

const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 transition-colors appearance-none";

const TEXTAREA_CLASS = cn(
  "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-xs transition-[color,box-shadow] outline-none resize-none",
  "placeholder:text-muted-foreground",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  "dark:bg-input/30",
);

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskDetailDrawer({ taskId, onClose, onUpdated, onDeleted }: TaskDetailDrawerProps) {
  const [fetchState, setFetchState] = React.useState<FetchState | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState<EditForm | null>(null);
  const [saveState, setSaveState] = React.useState<SaveState>({ phase: "idle" });
  const [members, setMembers] = React.useState<ProjectMembership[]>([]);
  const [membersLoading, setMembersLoading] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const open = taskId !== null;

  // Load task details whenever the drawer is opened for a (new) task.
  React.useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    setFetchState({ status: "loading" });
    setEditing(false);
    setForm(null);
    setSaveState({ phase: "idle" });
    setMembers([]);
    setDeleteError(null);

    fetch(`/api/tasks/${taskId}`)
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setFetchState({ status: "error", message: data.message ?? "Failed to load task." });
          return;
        }
        setFetchState({ status: "success", task: data as TaskSummary });
      })
      .catch(() => {
        if (!cancelled) setFetchState({ status: "error", message: "Network error. Please try again." });
      });

    return () => { cancelled = true; };
  }, [taskId]);

  const task = fetchState?.status === "success" ? fetchState.task : null;

  // Load project members for the assignee selector, once editing starts.
  React.useEffect(() => {
    if (!editing || !task || members.length > 0) return;
    let cancelled = false;
    setMembersLoading(true);
    fetch(`/api/projects/${task.project}/members?page_size=100`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setMembers(data.results?.data ?? []);
          setMembersLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setMembersLoading(false);
      });
    return () => { cancelled = true; };
  }, [editing, task, members.length]);

  function startEditing() {
    if (!task) return;
    setForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      task_type: task.task_type,
      start_date: task.start_date ?? "",
      due_date: task.due_date ?? "",
      assigned_to: task.assigned_to ?? "",
    });
    setSaveState({ phase: "idle" });
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setForm(null);
    setSaveState({ phase: "idle" });
  }

  async function handleSave() {
    if (!task || !form) return;
    const title = form.title.trim();
    if (!title) {
      setSaveState({ phase: "error", message: "Title cannot be empty." });
      return;
    }
    setSaveState({ phase: "saving" });

    const payload = {
      title,
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      task_type: form.task_type,
      start_date: form.start_date || null,
      due_date: form.due_date || null,
      assigned_to: form.assigned_to || null,
    };

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setSaveState({ phase: "error", message: data.message ?? "Failed to update task." });
        return;
      }

      const updated = data as TaskSummary;
      setFetchState({ status: "success", task: updated });
      setSaveState({ phase: "idle" });
      setEditing(false);
      setForm(null);
      onUpdated?.(updated);
    } catch {
      setSaveState({ phase: "error", message: "Network error. Please check your connection." });
    }
  }

  async function handleDelete() {
    if (!task) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.message ?? "Failed to delete task.");
        setDeleting(false);
        return;
      }
      setDeleting(false);
      setDeleteOpen(false);
      onDeleted?.(task.id);
      onClose();
    } catch {
      setDeleteError("Network error. Please try again.");
      setDeleting(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (saveState.phase === "saving" || deleting) return;
    if (!next) onClose();
  }

  const isSaving = saveState.phase === "saving";

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg" showCloseButton={!isSaving}>
          {fetchState?.status === "loading" && (
            <div className="flex flex-1 items-center justify-center">
              <Spinner className="size-6 text-muted-foreground" />
            </div>
          )}

          {fetchState?.status === "error" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <FormErrorBanner message={fetchState.message} />
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
          )}

          {task && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <TaskStatusBadge status={task.status} />
                  <TaskPriorityBadge priority={task.priority} />
                </div>
                <SheetTitle className="text-base leading-snug">{task.title}</SheetTitle>
                <SheetDescription>
                  in{" "}
                  <Link
                    href={`/projects/${task.project}?tab=tasks`}
                    prefetch={false}
                    className="font-medium text-foreground hover:underline"
                  >
                    {task.project_name}
                  </Link>
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                {saveState.phase === "error" && (
                  <div className="mb-4">
                    <FormErrorBanner message={saveState.message} />
                  </div>
                )}

                {editing && form ? (
                  <EditFields
                    form={form}
                    setForm={setForm}
                    members={members}
                    membersLoading={membersLoading}
                    disabled={isSaving}
                  />
                ) : (
                  <ViewFields task={task} />
                )}
              </div>

              <SheetFooter>
                {editing ? (
                  <>
                    <Button variant="ghost" onClick={cancelEditing} disabled={isSaving}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving || !form?.title.trim()}
                      className="min-w-[120px] gap-1.5"
                    >
                      {isSaving ? (<><Spinner />Saving…</>) : "Save Changes"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="destructive" className="gap-1.5" onClick={() => setDeleteOpen(true)}>
                      <Trash2 className="size-3.5" />
                      Delete Task
                    </Button>
                    <Button className="gap-1.5" onClick={startEditing}>
                      <Pencil className="size-3.5" />
                      Edit
                    </Button>
                  </>
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(next) => { if (!deleting) setDeleteOpen(next); }}
        title="Delete this task?"
        description={
          <>
            This will permanently delete{" "}
            <span className="font-semibold text-foreground">{task?.title}</span>. This cannot be undone.
          </>
        }
        detail={deleteError ? <FormErrorBanner message={deleteError} /> : undefined}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  );
}

// ─── View mode ────────────────────────────────────────────────────────────────

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 px-3 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 truncate text-foreground">{children}</dd>
    </div>
  );
}

function ViewFields({ task }: { task: TaskSummary }) {
  const formatDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
      : "—";

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Description
        </h3>
        {task.description ? (
          <p className="whitespace-pre-wrap text-sm text-foreground">{task.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No description provided.</p>
        )}
      </div>

      <dl className="divide-y divide-border/60 rounded-lg border border-border">
        <DetailRow label="Task Type">{TASK_TYPE_META[task.task_type].label}</DetailRow>
        <DetailRow label="Assignee">{task.assigned_to_email ?? "Unassigned"}</DetailRow>
        <DetailRow label="Parent Task">{task.parent_task ?? "—"}</DetailRow>
        <DetailRow label="Start Date">{formatDate(task.start_date)}</DetailRow>
        <DetailRow label="Due Date">{formatDate(task.due_date)}</DetailRow>
        <DetailRow label="Created By">{task.created_by_email}</DetailRow>
        <DetailRow label="Created At">{formatDateTime(task.created_at)}</DetailRow>
      </dl>
    </div>
  );
}

// ─── Edit mode ────────────────────────────────────────────────────────────────

type EditFieldsProps = {
  form: EditForm;
  setForm: React.Dispatch<React.SetStateAction<EditForm | null>>;
  members: ProjectMembership[];
  membersLoading: boolean;
  disabled: boolean;
};

function EditFields({ form, setForm, members, membersLoading, disabled }: EditFieldsProps) {
  function update<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="drawer-title" className="text-sm font-medium text-foreground">
          Title
        </Label>
        <Input
          id="drawer-title"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          maxLength={255}
          disabled={disabled}
          autoComplete="off"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="drawer-description" className="text-sm font-medium text-foreground">
          Description <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <textarea
          id="drawer-description"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Add more context for this task…"
          disabled={disabled}
          rows={4}
          className={TEXTAREA_CLASS}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="drawer-status" className="text-sm font-medium text-foreground">
            Status
          </Label>
          <select
            id="drawer-status"
            value={form.status}
            onChange={(e) => update("status", e.target.value as TaskStatus)}
            disabled={disabled}
            className={SELECT_CLASS}
          >
            {ALL_TASK_STATUSES.map((s) => (
              <option key={s} value={s}>{TASK_STATUS_META[s].label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="drawer-priority" className="text-sm font-medium text-foreground">
            Priority
          </Label>
          <select
            id="drawer-priority"
            value={form.priority}
            onChange={(e) => update("priority", e.target.value as TaskPriority)}
            disabled={disabled}
            className={SELECT_CLASS}
          >
            {ALL_TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>{TASK_PRIORITY_META[p].label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="drawer-type" className="text-sm font-medium text-foreground">
            Task Type
          </Label>
          <select
            id="drawer-type"
            value={form.task_type}
            onChange={(e) => update("task_type", e.target.value as TaskType)}
            disabled={disabled}
            className={SELECT_CLASS}
          >
            {ALL_TASK_TYPES.map((t) => (
              <option key={t} value={t}>{TASK_TYPE_META[t].label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="drawer-assignee" className="text-sm font-medium text-foreground">
            Assignee
          </Label>
          <select
            id="drawer-assignee"
            value={form.assigned_to}
            onChange={(e) => update("assigned_to", e.target.value)}
            disabled={disabled || membersLoading}
            className={SELECT_CLASS}
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.user} value={m.user}>{m.user_email}</option>
            ))}
          </select>
          {membersLoading && (
            <p className="text-xs text-muted-foreground">Loading members…</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="drawer-start-date" className="text-sm font-medium text-foreground">
            Start Date
          </Label>
          <Input
            id="drawer-start-date"
            type="date"
            value={form.start_date}
            onChange={(e) => update("start_date", e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="drawer-due-date" className="text-sm font-medium text-foreground">
            Due Date
          </Label>
          <Input
            id="drawer-due-date"
            type="date"
            value={form.due_date}
            onChange={(e) => update("due_date", e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
