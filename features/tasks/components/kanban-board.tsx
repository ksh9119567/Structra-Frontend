"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { TaskPriorityBadge } from "./task-priority-badge";
import {
  ALL_TASK_STATUSES,
  TASK_STATUS_META,
  TASK_TYPE_META,
  type TaskSummary,
  type TaskStatus,
} from "@/lib/tasks/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type KanbanBoardProps = {
  tasks: TaskSummary[];
  onSelectTask: (taskId: string) => void;
};

// ─── Board ────────────────────────────────────────────────────────────────────

export function KanbanBoard({ tasks, onSelectTask }: KanbanBoardProps) {
  const columns = React.useMemo(() => {
    const grouped = new Map<TaskStatus, TaskSummary[]>();
    for (const status of ALL_TASK_STATUSES) {
      grouped.set(status, []);
    }
    for (const task of tasks) {
      grouped.get(task.status)?.push(task);
    }
    return grouped;
  }, [tasks]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {ALL_TASK_STATUSES.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={columns.get(status) ?? []}
          onSelectTask={onSelectTask}
        />
      ))}
    </div>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────

function KanbanColumn({
  status,
  tasks,
  onSelectTask,
}: {
  status: TaskStatus;
  tasks: TaskSummary[];
  onSelectTask: (taskId: string) => void;
}) {
  const meta = TASK_STATUS_META[status];

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-3 py-2.5">
        <span className={cn("size-2 rounded-full", meta.dotClass)} />
        <h3 className="text-sm font-semibold text-foreground">{meta.label}</h3>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {tasks.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-2.5">
        {tasks.length === 0 ? (
          <p className="px-1.5 py-3 text-center text-xs text-muted-foreground">No tasks</p>
        ) : (
          tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onClick={() => onSelectTask(task.id)} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function KanbanCard({ task, onClick }: { task: TaskSummary; onClick: () => void }) {
  const dueDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  const isOverdue =
    !!task.due_date &&
    task.status !== "DONE" &&
    new Date(task.due_date) < new Date(new Date().toDateString());

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-2 rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-ring/50 hover:bg-accent/30"
    >
      <p className="line-clamp-2 text-sm font-medium text-foreground">{task.title}</p>

      <div className="flex flex-wrap items-center gap-1.5">
        <TaskPriorityBadge priority={task.priority} />
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {TASK_TYPE_META[task.task_type].label}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="truncate">{task.project_name}</span>
        {dueDate && (
          <span className={cn("shrink-0 tabular-nums", isOverdue && "font-medium text-destructive")}>
            {dueDate}
          </span>
        )}
      </div>
    </button>
  );
}
