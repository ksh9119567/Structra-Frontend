"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Plus,
  FolderKanban,
  Users,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProjectStatusBadge } from "@/features/shared/project-status-badge";
import { CreateProjectModal } from "@/features/projects/components/create-project-modal";
import { MembersTablePagination } from "@/features/shared/members/members-table-ui";
import type { ProjectSummary, ProjectStatus } from "@/lib/projects/types";
import { ALL_PROJECT_STATUSES, PROJECT_STATUS_META } from "@/lib/projects/types";
import type { OrganizationSummary, OrgRole } from "@/lib/organizations/types";

const PAGE_SIZE = 12;

// ─── Types ────────────────────────────────────────────────────────────────────

type FetchState =
  | { status: "loading" }
  | { status: "success"; projects: ProjectSummary[]; total: number }
  | { status: "error"; message: string };

type OrgProjectsTabProps = {
  org: OrganizationSummary;
  currentUserRole: OrgRole;
};

// ─── Role gate ────────────────────────────────────────────────────────────────
// Default org policy requires ADMIN to create a project; owners always qualify.

import { ORG_ROLE_LEVEL as ROLE_LEVEL } from "@/lib/roles";

// ─── Component ────────────────────────────────────────────────────────────────

export function OrgProjectsTab({ org, currentUserRole }: OrgProjectsTabProps) {
  const router = useRouter();
  const [fetchState, setFetchState] = React.useState<FetchState>({ status: "loading" });
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<ProjectStatus | "">("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);

  const canCreateProject = ROLE_LEVEL[currentUserRole] >= ROLE_LEVEL.ADMIN;

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

      const res = await fetch(`/api/organizations/${org.id}/projects?${params.toString()}`);
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
  }, [org.id, page, debouncedSearch, statusFilter]);

  React.useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const projects = fetchState.status === "success" ? fetchState.projects : [];
  const total = fetchState.status === "success" ? fetchState.total : 0;
  const isLoading = fetchState.status === "loading";
  const isError = fetchState.status === "error";
  const isEmpty = fetchState.status === "success" && projects.length === 0;
  const hasFilters = !!debouncedSearch || !!statusFilter;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

      {/* ── Toolbar ── */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
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
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

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
        </div>

        <div className="flex items-center gap-3">
          {fetchState.status === "success" && (
            <p className="text-sm text-muted-foreground">
              {total} {total === 1 ? "project" : "projects"}
            </p>
          )}
          {canCreateProject && (
            <Button size="default" className="gap-1.5 shrink-0" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Create Project
            </Button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {isLoading && <ProjectGridSkeleton />}

      {isError && (
        <ErrorState
          message={(fetchState as { status: "error"; message: string }).message}
          onRetry={fetchProjects}
        />
      )}

      {isEmpty && (
        <EmptyState
          hasFilters={hasFilters}
          canCreate={canCreateProject}
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

      {/* ── Create modal ── */}
      <CreateProjectModal
        open={createOpen}
        preselectedOrgId={org.id}
        preselectedOrgName={org.name}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          fetchProjects();
          router.refresh();
        }}
      />
    </div>
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

function ProjectCard({ project }: { project: ProjectSummary }) {
  const initial = project.name.charAt(0).toUpperCase();
  const isArchived = project.status === "ARCHIVED";

  return (
    <Link
      href={`/projects/${project.id}`}
      prefetch={false}
      className={cn(
        "group flex flex-col rounded-xl border border-border bg-card p-5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        isArchived
          ? "opacity-60 hover:opacity-80"
          : "hover:border-primary/30 hover:bg-card/80 hover:shadow-sm",
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg text-base font-bold",
              isArchived ? "bg-muted text-muted-foreground" : "bg-warning/15 text-warning",
            )}
          >
            {initial}
          </span>
          <div className="min-w-0">
            <p
              className={cn(
                "truncate text-sm font-semibold transition-colors",
                isArchived
                  ? "text-muted-foreground line-through"
                  : "text-foreground group-hover:text-primary",
              )}
            >
              {project.name}
            </p>
            {project.team_name && (
              <p className="truncate text-xs text-muted-foreground">{project.team_name}</p>
            )}
          </div>
        </div>
        <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>

      <div className="mb-3">
        <ProjectStatusBadge status={project.status} />
      </div>

      {project.description && (
        <p className="mb-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {project.description}
        </p>
      )}

      <div className="mt-auto flex items-center gap-3 border-t border-border/60 pt-3.5">
        <ProjectStat icon={Users} value={project.member_count} label="members" />
      </div>
    </Link>
  );
}

function ProjectStat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="size-3.5 shrink-0" />
      <span className="font-semibold tabular-nums text-foreground">{value}</span>
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProjectGridSkeleton() {
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
          <div className="mb-3 h-5 w-20 rounded-full bg-muted" />
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
  canCreate,
  onClear,
  onCreate,
}: {
  hasFilters: boolean;
  canCreate: boolean;
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
            No projects match your current filters.
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
            {canCreate
              ? "Create the first project in this organization."
              : "No projects have been created in this organization yet."}
          </p>
          {canCreate && (
            <Button onClick={onCreate} className="mt-5 gap-1.5" size="default">
              <Plus className="size-4" />
              Create Project
            </Button>
          )}
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
