"use client";

/**
 * Shared members-table UI primitives.
 * Used by OrgMembersTab, TeamMembersTab, and (future) ProjectMembersTab.
 * Zero business logic — pure presentational building blocks.
 */

import * as React from "react";
import {
  Search,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  AlertCircle,
  Users,
  UserPlus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Member search bar ────────────────────────────────────────────────────────

type MemberSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function MemberSearchBar({
  value,
  onChange,
  placeholder = "Search by email…",
}: MemberSearchBarProps) {
  return (
    <div className="relative max-w-xs flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-border bg-card pl-8 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── Role filter select ───────────────────────────────────────────────────────

type RoleFilterSelectProps<T extends string> = {
  value: T | "";
  onChange: (value: T | "") => void;
  roles: T[];
};

export function RoleFilterSelect<T extends string>({
  value,
  onChange,
  roles,
}: RoleFilterSelectProps<T>) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T | "")}
      className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
    >
      <option value="">All roles</option>
      {roles.map((r) => (
        <option key={r} value={r}>
          {r.charAt(0) + r.slice(1).toLowerCase()}
        </option>
      ))}
    </select>
  );
}

// ─── Sort button ──────────────────────────────────────────────────────────────

type SortDir = "asc" | "desc";

type SortButtonProps<T extends string> = {
  label: string;
  field: T;
  current: T;
  dir: SortDir;
  onToggle: (field: T) => void;
};

export function SortButton<T extends string>({
  label,
  field,
  current,
  dir,
  onToggle,
}: SortButtonProps<T>) {
  const isActive = current === field;
  return (
    <button
      onClick={() => onToggle(field)}
      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {label}
      {isActive ? (
        dir === "asc" ? (
          <ChevronUp className="size-3" />
        ) : (
          <ChevronDown className="size-3" />
        )
      ) : (
        <ChevronsUpDown className="size-3 opacity-40" />
      )}
    </button>
  );
}

// ─── Skeleton row (5-column members table) ────────────────────────────────────

export function MemberSkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="size-8 shrink-0 rounded-full bg-muted" />
          <div className="h-3.5 w-40 rounded bg-muted" />
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-16 rounded-full bg-muted" />
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        <div className="h-3.5 w-12 rounded bg-muted" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3.5 w-24 rounded bg-muted" />
      </td>
      <td className="px-4 py-3">
        <div className="size-7 rounded bg-muted" />
      </td>
    </tr>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

type MembersEmptyStateProps = {
  hasFilters: boolean;
  onClear: () => void;
  onInvite?: () => void;
  /** Context label e.g. "organization" or "team" */
  context?: string;
};

export function MembersEmptyState({
  hasFilters,
  onClear,
  onInvite,
  context = "organization",
}: MembersEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-xl border border-border bg-muted/50">
        <Users className="size-6 text-muted-foreground" />
      </span>
      {hasFilters ? (
        <>
          <p className="text-sm font-medium text-foreground">No members found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            No members match your current filters.
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
          <p className="text-sm font-medium text-foreground">No members yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Invite people to join this {context}.
          </p>
          {onInvite && (
            <Button size="sm" className="mt-4 gap-1.5" onClick={onInvite}>
              <UserPlus className="size-3.5" />
              Invite Member
            </Button>
          )}
        </>
      )}
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

type MembersErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export function MembersErrorState({ message, onRetry }: MembersErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <AlertCircle className="mb-3 size-7 text-destructive" />
      <p className="text-sm font-medium text-foreground">Failed to load members</p>
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

// ─── Pagination footer ────────────────────────────────────────────────────────

type MembersTablePaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPrev: () => void;
  onNext: () => void;
};

export function MembersTablePagination({
  page,
  totalPages,
  total,
  pageSize,
  onPrev,
  onNext,
}: MembersTablePaginationProps) {
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3">
      <p className="text-xs text-muted-foreground">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={page <= 1}
          onClick={onPrev}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-[3rem] text-center text-xs text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={page >= totalPages}
          onClick={onNext}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
