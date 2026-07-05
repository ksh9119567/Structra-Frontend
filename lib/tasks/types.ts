/**
 * Task types matching DRF serializer output.
 * GET /api/v1/tasks/get-project-tasks/  → paginated list of TaskSummary
 * POST /api/v1/tasks/create-task/       → TaskSummary
 */

export type TaskStatus = "TO_DO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "BLOCKED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TaskType = "BUG" | "FEATURE" | "IMPROVEMENT" | "DOCUMENTATION";

/** A single task record returned by get-project-tasks. */
export type TaskSummary = {
  id: string;
  project: string;
  project_name: string;
  parent: string | null;
  parent_task: string | null;
  title: string;
  description: string;
  start_date: string | null;     // ISO date
  due_date: string | null;       // ISO date
  status: TaskStatus;
  priority: TaskPriority;
  task_type: TaskType;
  assigned_to: string | null;    // UUID
  assigned_to_email: string | null;
  created_by_email: string;
  created_at: string;            // ISO datetime
};

export const ALL_TASK_STATUSES: TaskStatus[] = ["TO_DO", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"];

export const ALL_TASK_PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export const ALL_TASK_TYPES: TaskType[] = ["BUG", "FEATURE", "IMPROVEMENT", "DOCUMENTATION"];

/** Visual metadata for each task status — used by TaskStatusBadge. */
export const TASK_STATUS_META: Record<
  TaskStatus,
  { label: string; className: string; dotClass: string }
> = {
  TO_DO: {
    label: "To Do",
    className: "bg-muted text-muted-foreground",
    dotClass: "bg-muted-foreground/50",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-info/15 text-info",
    dotClass: "bg-info",
  },
  REVIEW: {
    label: "In Review",
    className: "bg-warning/15 text-warning",
    dotClass: "bg-warning",
  },
  DONE: {
    label: "Done",
    className: "bg-success/15 text-success",
    dotClass: "bg-success",
  },
  BLOCKED: {
    label: "Blocked",
    className: "bg-destructive/15 text-destructive",
    dotClass: "bg-destructive",
  },
};

/** Visual metadata for each task priority — used by TaskPriorityBadge. */
export const TASK_PRIORITY_META: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  LOW: { label: "Low", className: "bg-muted text-muted-foreground" },
  MEDIUM: { label: "Medium", className: "bg-info/15 text-info" },
  HIGH: { label: "High", className: "bg-warning/15 text-warning" },
  URGENT: { label: "Urgent", className: "bg-destructive/15 text-destructive" },
};

/** Display labels for each task type. */
export const TASK_TYPE_META: Record<TaskType, { label: string }> = {
  BUG: { label: "Bug" },
  FEATURE: { label: "Feature" },
  IMPROVEMENT: { label: "Improvement" },
  DOCUMENTATION: { label: "Documentation" },
};
