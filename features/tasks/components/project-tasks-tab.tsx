"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  MemberSearchBar,
  SortButton,
  MembersTablePagination,
} from "@/features/shared/members/members-table-ui";
import { FilterSelect } from "@/features/shared/filter-select";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskPriorityBadge } from "./task-priority-badge";
import { TaskSkeletonRow, TasksEmptyState, TasksErrorState } from "./task-list-ui";
import { CreateTaskModal } from "./create-task-modal";
import { TaskDetailDrawer } from "./task-detail-drawer";
import type { ProjectRole, ProjectSummary } from "@/lib/projects/types";
import {
  ALL_TASK_STATUSES,
  ALL_TASK_PRIORITIES,
  TASK_STATUS_META,
  TASK_PRIORITY_META,
  TASK_TYPE_META,
  type TaskSummary,
  type TaskStatus,
  type TaskPriority,
} from "@/lib/tasks/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

import { PROJECT_ROLE_LEVEL as ROLE_LEVEL } from "@/lib/roles";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField = "due_date" | "created_at";
type SortDir = "asc" | "desc";

type FetchState =
  | { status: "loading" }
  | { status: "success"; tasks: TaskSummary[]; total: number }
  | { status: "error"; message: string };

type ProjectTasksTabProps = {
  project: ProjectSummary;
  currentUserRole: ProjectRole;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectTasksTab({ project, currentUserRole }: ProjectTasksTabProps) {
  const [fetchState, setFetchState] = React.useState<FetchState>({ status: "loading" });
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<TaskStatus | "">("");
  const [priorityFilter, setPriorityFilter] = React.useState<TaskPriority | "">("");
  const [sortField, setSortField] = React.useState<SortField>("created_at");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when filters change
  React.useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, priorityFilter, sortField, sortDir]);

  // Fetch tasks
  const fetchTasks = React.useCallback(async () => {
    setFetchState({ status: "loading" });
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(PAGE_SIZE),
        ordering: `${sortDir === "desc" ? "-" : ""}${sortField}`,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter) params.set("status", statusFilter);
      if (priorityFilter) params.set("priority", priorityFilter);

      const res = await fetch(`/api/projects/${project.id}/tasks?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setFetchState({ status: "error", message: data.message ?? "Failed to load tasks." });
        return;
      }

      const tasks: TaskSummary[] = data.results?.data ?? [];
      setFetchState({ status: "success", tasks, total: data.count ?? tasks.length });
    } catch {
      setFetchState({ status: "error", message: "Network error. Please try again." });
    }
  }, [project.id, page, debouncedSearch, statusFilter, priorityFilter, sortField, sortDir]);

  React.useEffect(() => { fetchTasks(); }, [fetchTasks, refreshKey]);

  const tasks = fetchState.status === "success" ? fetchState.tasks : [];
  const total = fetchState.status === "success" ? fetchState.total : 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isLoading = fetchState.status === "loading";
  const isError = fetchState.status === "error";
  const isEmpty = fetchState.status === "success" && tasks.length === 0;
  const hasFilters = !!debouncedSearch || !!statusFilter || !!priorityFilter;

  // Default min role to create a task is MANAGER (project_constant.PROJECT_ACTION_POLICIES);
  // the backend re-validates against the project's actual governance settings.
  const canCreate = ROLE_LEVEL[currentUserRole] >= ROLE_LEVEL.MANAGER;

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  function handleCreated() {
    setCreateOpen(false);
    setPage(1);
    setRefreshKey((k) => k + 1);
  }

  function handleTaskUpdated() {
    setRefreshKey((k) => k + 1);
  }

  function handleTaskDeleted() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

      {/* ── Toolbar ── */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <MemberSearchBar value={search} onChange={setSearch} placeholder="Search tasks…" />
          <FilterSelect<TaskStatus>
            value={statusFilter}
            onChange={setStatusFilter}
            options={ALL_TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_META[s].label }))}
            allLabel="All statuses"
          />
          <FilterSelect<TaskPriority>
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={ALL_TASK_PRIORITIES.map((p) => ({ value: p, label: TASK_PRIORITY_META[p].label }))}
            allLabel="All priorities"
          />
        </div>
        <div className="flex items-center gap-3">
          {fetchState.status === "success" && (
            <p className="text-sm text-muted-foreground">
              {total} {total === 1 ? "task" : "tasks"}
            </p>
          )}
          {canCreate && (
            <Button size="default" className="gap-1.5 shrink-0" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Create Task
            </Button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[40%]">
                  Task
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">
                  Assignee
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <span className="inline-flex justify-end w-full">
                    <SortButton<SortField>
                      label="Due"
                      field="due_date"
                      current={sortField}
                      dir={sortDir}
                      onToggle={toggleSort}
                    />
                  </span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => <TaskSkeletonRow key={i} />)}

              {!isLoading && !isError && !isEmpty &&
                tasks.map((task) => (
                  <TaskRow key={task.id} task={task} onSelect={() => setSelectedTaskId(task.id)} />
                ))}
            </tbody>
          </table>
        </div>

        {isEmpty && (
          <TasksEmptyState
            hasFilters={hasFilters}
            onClear={() => { setSearch(""); setStatusFilter(""); setPriorityFilter(""); }}
            onCreate={canCreate ? () => setCreateOpen(true) : undefined}
          />
        )}

        {isError && (
          <TasksErrorState
            message={(fetchState as { status: "error"; message: string }).message}
            onRetry={fetchTasks}
          />
        )}

        {!isLoading && !isError && !isEmpty && (
          <MembersTablePagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={PAGE_SIZE}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
          />
        )}
      </div>

      {/* ── Modals ── */}
      <CreateTaskModal
        open={createOpen}
        projectId={project.id}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />

      <TaskDetailDrawer
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdated={handleTaskUpdated}
        onDeleted={handleTaskDeleted}
      />
    </div>
  );
}

// ─── Task Row ─────────────────────────────────────────────────────────────────

function TaskRow({ task, onSelect }: { task: TaskSummary; onSelect: () => void }) {
  const dueDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  const isOverdue =
    !!task.due_date &&
    task.status !== "DONE" &&
    new Date(task.due_date) < new Date(new Date().toDateString());

  return (
    <tr
      onClick={onSelect}
      className="cursor-pointer transition-colors hover:bg-accent/30"
    >
      {/* Title */}
      <td className="px-4 py-3">
        <p className="max-w-[320px] truncate text-sm font-medium text-foreground">
          {task.title}
        </p>
      </td>

      {/* Type */}
      <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">
        {TASK_TYPE_META[task.task_type].label}
      </td>

      {/* Priority */}
      <td className="px-4 py-3">
        <TaskPriorityBadge priority={task.priority} />
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <TaskStatusBadge status={task.status} />
      </td>

      {/* Assignee */}
      <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
        {task.assigned_to_email ?? "Unassigned"}
      </td>

      {/* Due date */}
      <td
        className={cn(
          "px-4 py-3 text-right text-xs tabular-nums",
          isOverdue ? "font-medium text-destructive" : "text-muted-foreground",
        )}
      >
        {dueDate}
      </td>
    </tr>
  );
}
