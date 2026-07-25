"use client";

import * as React from "react";
import {
  FolderKanban,
  Plus,
  Search,
  AlertCircle,
  RefreshCw,
  X,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/features/shared/project-card";
import { MembersTablePagination } from "@/features/shared/members/members-table-ui";
import type { ProjectSummary, ProjectStatus } from "@/lib/projects/types";
import { ALL_PROJECT_STATUSES, PROJECT_STATUS_META } from "@/lib/projects/types";
import { CreateProjectModal } from "./create-project-modal";

const PAGE_SIZE = 12;

// ─── Types ────────────────────────────────────────────────────────────────────

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; projects: ProjectSummary[]; total: number }
  | { status: "error"; message: string };

// ─── Main View ────────────────────────────────────────────────────────────────

export function ProjectsView() {
  const [fetchState, setFetchState] = React.useState<FetchState>({ status: "idle" });
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<ProjectStatus | "">("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when filters change
  React.useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  // Fetch projects
  const fetchProjects = React.useCallback(async () => {
    setFetchState({ status: "loading" });
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/projects?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setFetchState({ status: "error", message: data.message ?? "Failed to load projects." });
        return;
      }

      const projects: ProjectSummary[] = data.results?.data ?? [];
      setFetchState({ status: "success", projects, total: data.count ?? projects.length });
    } catch {
      setFetchState({ status: "error", message: "Network error. Please try again." });
    }
  }, [page, debouncedSearch, statusFilter]);

  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  function handleCreated(project: ProjectSummary) {
    setCreateOpen(false);
    // Optimistically prepend the new project (only meaningful on page 1)
    setFetchState((prev) => {
      if (prev.status !== "success") return prev;
      if (page !== 1) return { ...prev, total: prev.total + 1 };
      return { ...prev, projects: [project, ...prev.projects], total: prev.total + 1 };
    });
  }

  const projects = fetchState.status === "success" ? fetchState.projects : [];
  const isLoading = fetchState.status === "loading" || fetchState.status === "idle";
  const isError = fetchState.status === "error";
  const isEmpty = fetchState.status === "success" && projects.length === 0;
  const hasFilters = !!debouncedSearch || !!statusFilter;

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Page header ── */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Projects</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Plan, track, and deliver work across your organizations, teams, and personal projects.
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="shrink-0 gap-1.5"
            size="default"
          >
            <Plus className="size-4" />
            Create Project
          </Button>
        </div>

        {/* ── Filters ── */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="h-9 w-full rounded-lg border border-border bg-card pl-8 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Status filter */}
          <div className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | "")}
              className="h-9 rounded-lg border border-border bg-card pl-8 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors appearance-none"
            >
              <option value="">All statuses</option>
              {ALL_PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PROJECT_STATUS_META[s].label}
                </option>
              ))}
            </select>
          </div>

          {fetchState.status === "success" && (
            <p className="text-sm text-muted-foreground sm:ml-auto">
              {fetchState.total === 1 ? "1 project" : `${fetchState.total} projects`}
            </p>
          )}
        </div>

        {/* ── Content ── */}
        {isLoading && <ProjectListSkeleton />}
        {isError && (
          <ErrorState
            message={(fetchState as { status: "error"; message: string }).message}
            onRetry={fetchProjects}
          />
        )}
        {isEmpty && (
          <EmptyState
            hasFilters={hasFilters}
            onClear={() => { setSearch(""); setStatusFilter(""); }}
            onCreate={() => setCreateOpen(true)}
          />
        )}
        {!isLoading && !isError && !isEmpty && (
          <>
            <ProjectGrid projects={projects} />
            {fetchState.status === "success" && fetchState.total > PAGE_SIZE && (
              <div className="mt-4 rounded-xl border border-border bg-card">
                <MembersTablePagination
                  page={page}
                  totalPages={Math.max(1, Math.ceil(fetchState.total / PAGE_SIZE))}
                  total={fetchState.total}
                  pageSize={PAGE_SIZE}
                  onPrev={() => setPage((p) => p - 1)}
                  onNext={() => setPage((p) => p + 1)}
                />
              </div>
            )}
          </>
        )}
      </div>

      <CreateProjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}

// ─── Project Grid ─────────────────────────────────────────────────────────────

function ProjectGrid({ projects }: { projects: ProjectSummary[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProjectListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col rounded-xl border border-border bg-card p-5 animate-pulse"
        >
          <div className="mb-3 flex items-start gap-3">
            <div className="size-10 shrink-0 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2 pt-0.5">
              <div className="h-3.5 w-3/4 rounded bg-muted" />
            </div>
          </div>
          {/* Badges skeleton */}
          <div className="mb-3 flex gap-2">
            <div className="h-5 w-16 rounded-full bg-muted" />
            <div className="h-5 w-20 rounded-full bg-muted" />
          </div>
          {/* Description skeleton */}
          <div className="mb-3 space-y-1.5">
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-2/3 rounded bg-muted" />
          </div>
          <div className="mt-auto border-t border-border/60 pt-3.5">
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  hasFilters,
  onClear,
  onCreate,
}: {
  hasFilters: boolean;
  onClear: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-xl border border-border bg-card">
        <FolderKanban className="size-7 text-muted-foreground" />
      </span>
      {hasFilters ? (
        <>
          <p className="text-sm font-medium text-foreground">No projects found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No results match your current filters.
          </p>
          <button
            onClick={onClear}
            className="mt-4 text-sm font-medium text-primary hover:underline underline-offset-4"
          >
            Clear filters
          </button>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-foreground">No projects yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Create your first project to start organizing work.
          </p>
          <Button onClick={onCreate} className="mt-5 gap-1.5" size="default">
            <Plus className="size-4" />
            Create Project
          </Button>
        </>
      )}
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-16 text-center">
      <AlertCircle className="mb-3 size-8 text-destructive" />
      <p className="text-sm font-medium text-foreground">Failed to load projects</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4"
      >
        <RefreshCw className="size-3.5" />
        Try again
      </button>
    </div>
  );
}
