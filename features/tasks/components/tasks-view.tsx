"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Table2, KanbanSquare } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/features/shared/members/member-ui";
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
import { KanbanBoard } from "./kanban-board";
import type { ProjectSummary } from "@/lib/projects/types";
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

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField = "due_date" | "created_at";
type SortDir = "asc" | "desc";

type FetchState =
  | { status: "loading" }
  | { status: "success"; tasks: TaskSummary[]; total: number }
  | { status: "error"; message: string };

type ViewMode = "table" | "kanban";

// ─── Component ────────────────────────────────────────────────────────────────

export function TasksView() {
  const [fetchState, setFetchState] = React.useState<FetchState>({ status: "loading" });
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<TaskStatus | "">("");
  const [priorityFilter, setPriorityFilter] = React.useState<TaskPriority | "">("");
  const [projectFilter, setProjectFilter] = React.useState("");
  const [sortField, setSortField] = React.useState<SortField>("created_at");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [projectOptions, setProjectOptions] = React.useState<ProjectSummary[]>([]);
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<ViewMode>("table");

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, priorityFilter, projectFilter, sortField, sortDir]);

  // Load the current user's projects, used to populate the project filter.
  React.useEffect(() => {
    let cancelled = false;
    async function loadProjects() {
      try {
        const res = await fetch("/api/projects?page_size=100");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const projects: ProjectSummary[] = data.results?.data ?? [];
        if (!cancelled) {
          setProjectOptions([...projects].sort((a, b) => a.name.localeCompare(b.name)));
        }
      } catch {
        // fail open — project filter just won't have options
      }
    }
    loadProjects();
    return () => { cancelled = true; };
  }, []);

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
      if (projectFilter) params.set("project", projectFilter);

      const res = await fetch(`/api/tasks?${params.toString()}`);
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
  }, [page, debouncedSearch, statusFilter, priorityFilter, projectFilter, sortField, sortDir]);

  React.useEffect(() => { fetchTasks(); }, [fetchTasks, refreshKey]);

  const tasks = fetchState.status === "success" ? fetchState.tasks : [];
  const total = fetchState.status === "success" ? fetchState.total : 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isLoading = fetchState.status === "loading";
  const isError = fetchState.status === "error";
  const isEmpty = fetchState.status === "success" && tasks.length === 0;
  const hasFilters = !!debouncedSearch || !!statusFilter || !!priorityFilter || !!projectFilter;

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

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setProjectFilter("");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

      {/* ── Page header ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tasks assigned to you across all your projects.
          </p>
        </div>
      </div>

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
          <FilterSelect<string>
            value={projectFilter}
            onChange={setProjectFilter}
            options={projectOptions.map((p) => ({ value: p.id, label: p.name }))}
            allLabel="All projects"
          />
        </div>
        <div className="flex items-center gap-3">
          {fetchState.status === "success" && (
            <p className="text-sm text-muted-foreground">
              {total} {total === 1 ? "task" : "tasks"}
            </p>
          )}
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
          <Button
            size="default"
            className="gap-1.5 shrink-0"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" />
            Create Task
          </Button>
        </div>
      </div>

      {/* ── Results ── */}
      {viewMode === "table" ? (
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
                    Project
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
              onClear={clearFilters}
              onCreate={() => setCreateOpen(true)}
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
      ) : (
        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center rounded-xl border border-border bg-card py-16">
              <Spinner className="size-6 text-muted-foreground" />
            </div>
          )}

          {isError && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <TasksErrorState
                message={(fetchState as { status: "error"; message: string }).message}
                onRetry={fetchTasks}
              />
            </div>
          )}

          {isEmpty && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <TasksEmptyState
                hasFilters={hasFilters}
                onClear={clearFilters}
                onCreate={() => setCreateOpen(true)}
              />
            </div>
          )}

          {!isLoading && !isError && !isEmpty && (
            <>
              <KanbanBoard tasks={tasks} onSelectTask={setSelectedTaskId} />
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <MembersTablePagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  pageSize={PAGE_SIZE}
                  onPrev={() => setPage((p) => p - 1)}
                  onNext={() => setPage((p) => p + 1)}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      <CreateTaskModal
        open={createOpen}
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

// ─── View Mode Toggle ─────────────────────────────────────────────────────────

function ViewModeToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
      <button
        type="button"
        aria-pressed={value === "table"}
        onClick={() => onChange("table")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
          value === "table"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Table2 className="size-3.5" />
        Table
      </button>
      <button
        type="button"
        aria-pressed={value === "kanban"}
        onClick={() => onChange("kanban")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
          value === "kanban"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <KanbanSquare className="size-3.5" />
        Board
      </button>
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

      {/* Project */}
      <td className="hidden px-4 py-3 text-xs md:table-cell">
        <Link
          href={`/projects/${task.project}?tab=tasks`}
          prefetch={false}
          onClick={(e) => e.stopPropagation()}
          className="inline-block max-w-[160px] truncate text-muted-foreground hover:text-foreground hover:underline"
        >
          {task.project_name}
        </Link>
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
