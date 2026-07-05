"use client";

/**
 * Presentational building blocks for the project-level task browser.
 * Mirrors the shape of features/shared/members/members-table-ui.tsx,
 * adapted for the Task domain ahead of the future dedicated Tasks module.
 */

import { AlertCircle, ListTodo, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Skeleton row (6-column tasks table) ──────────────────────────────────────

export function TaskSkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3">
        <div className="h-3.5 w-48 rounded bg-muted" />
      </td>
      <td className="hidden px-4 py-3 lg:table-cell">
        <div className="h-3.5 w-16 rounded bg-muted" />
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-16 rounded-full bg-muted" />
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-20 rounded-full bg-muted" />
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        <div className="h-3.5 w-32 rounded bg-muted" />
      </td>
      <td className="px-4 py-3 text-right">
        <div className="ml-auto h-3.5 w-16 rounded bg-muted" />
      </td>
    </tr>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

type TasksEmptyStateProps = {
  hasFilters: boolean;
  onClear: () => void;
  onCreate?: () => void;
};

export function TasksEmptyState({ hasFilters, onClear, onCreate }: TasksEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-xl border border-border bg-muted/50">
        <ListTodo className="size-6 text-muted-foreground" />
      </span>
      {hasFilters ? (
        <>
          <p className="text-sm font-medium text-foreground">No tasks found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            No tasks match your current filters.
          </p>
          <button
            onClick={onClear}
            className="mt-3 text-xs font-medium text-primary hover:underline underline-offset-4"
          >
            Clear filters
          </button>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-foreground">No tasks yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create the first task to start tracking work on this project.
          </p>
          {onCreate && (
            <Button size="sm" className="mt-4 gap-1.5" onClick={onCreate}>
              <Plus className="size-3.5" />
              Create Task
            </Button>
          )}
        </>
      )}
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

type TasksErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export function TasksErrorState({ message, onRetry }: TasksErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <AlertCircle className="mb-3 size-7 text-destructive" />
      <p className="text-sm font-medium text-foreground">Failed to load tasks</p>
      <p className="mt-1 text-xs text-muted-foreground">{message}</p>
      <button
        onClick={onRetry}
        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline underline-offset-4"
      >
        <RefreshCw className="size-3" />
        Try again
      </button>
    </div>
  );
}
