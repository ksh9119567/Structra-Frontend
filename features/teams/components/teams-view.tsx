"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  FolderKanban,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  X,
  Building2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MembersTablePagination } from "@/features/shared/members/members-table-ui";
import type { TeamSummary } from "@/lib/teams/types";
import { CreateTeamModal } from "./create-team-modal";
import { TeamRoleBadge } from "./team-role-badge";

const PAGE_SIZE = 12;

// ─── Types ────────────────────────────────────────────────────────────────────

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; teams: TeamSummary[]; total: number }
  | { status: "error"; message: string };

// ─── Main View ────────────────────────────────────────────────────────────────

export function TeamsView() {
  const [fetchState, setFetchState] = React.useState<FetchState>({ status: "idle" });
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when the search changes
  React.useEffect(() => { setPage(1); }, [debouncedSearch]);

  // Fetch teams
  const fetchTeams = React.useCallback(async (searchTerm: string, pageNum: number) => {
    setFetchState({ status: "loading" });
    try {
      const params = new URLSearchParams({ page: String(pageNum), page_size: String(PAGE_SIZE) });
      if (searchTerm) params.set("search", searchTerm);
      const res = await fetch(`/api/teams?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setFetchState({ status: "error", message: data.message ?? "Failed to load teams." });
        return;
      }

      const teams: TeamSummary[] = data.results?.data ?? [];
      setFetchState({ status: "success", teams, total: data.count ?? teams.length });
    } catch {
      setFetchState({ status: "error", message: "Network error. Please try again." });
    }
  }, []);

  React.useEffect(() => {
    fetchTeams(debouncedSearch, page);
  }, [debouncedSearch, page, fetchTeams]);

  function handleCreated(team: TeamSummary) {
    setCreateOpen(false);
    // Optimistically prepend the new team (only meaningful on page 1)
    setFetchState((prev) => {
      if (prev.status !== "success") return prev;
      if (page !== 1) return { ...prev, total: prev.total + 1 };
      return { ...prev, teams: [team, ...prev.teams], total: prev.total + 1 };
    });
  }

  const teams = fetchState.status === "success" ? fetchState.teams : [];
  const isLoading = fetchState.status === "loading" || fetchState.status === "idle";
  const isError = fetchState.status === "error";
  const isEmpty = fetchState.status === "success" && teams.length === 0;

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Page header ── */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Teams</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your teams, members, and projects.
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="shrink-0 gap-1.5"
            size="default"
          >
            <Plus className="size-4" />
            Create Team
          </Button>
        </div>

        {/* ── Filters ── */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teams…"
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

          {fetchState.status === "success" && (
            <p className="text-sm text-muted-foreground sm:ml-auto">
              {fetchState.total === 1 ? "1 team" : `${fetchState.total} teams`}
            </p>
          )}
        </div>

        {/* ── Content ── */}
        {isLoading && <TeamListSkeleton />}
        {isError && (
          <ErrorState
            message={(fetchState as { status: "error"; message: string }).message}
            onRetry={() => fetchTeams(debouncedSearch, page)}
          />
        )}
        {isEmpty && (
          <EmptyState
            hasSearch={!!debouncedSearch}
            onClear={() => setSearch("")}
            onCreate={() => setCreateOpen(true)}
          />
        )}
        {!isLoading && !isError && !isEmpty && (
          <>
            <TeamGrid teams={teams} />
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

      <CreateTeamModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}

// ─── Team Grid ────────────────────────────────────────────────────────────────

function TeamGrid({ teams }: { teams: TeamSummary[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {teams.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </div>
  );
}

// ─── Team Card ────────────────────────────────────────────────────────────────

function TeamCard({ team }: { team: TeamSummary }) {
  const initial = team.name.charAt(0).toUpperCase();

  return (
    <Link
      href={`/teams/${team.id}`}
      prefetch={false}
      className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:bg-card/80 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      {/* Card header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Team avatar */}
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-info/15 text-base font-bold text-info">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {team.name}
            </p>
          </div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary mt-0.5" />
      </div>

      {/* Organization badge */}
      <div className="mb-3">
        {team.organization_name && team.organization ? (
          <span
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
            title={`Part of ${team.organization_name}`}
          >
            <Building2 className="size-3 shrink-0" />
            <span className="truncate max-w-[140px]">{team.organization_name}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground/60">
            <Building2 className="size-3 shrink-0" />
            Standalone
          </span>
        )}
      </div>

      {/* Description */}
      {team.description && (
        <p className="mb-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {team.description}
        </p>
      )}

      {/* Stats row */}
      <div className="mt-auto flex items-center gap-4 border-t border-border/60 pt-3.5">
        <TeamStat icon={Users} value={team.member_count} label="members" />
        <div className="h-3 w-px bg-border/60" />
        <TeamStat
          icon={FolderKanban}
          value={team.project_count}
          label="projects"
          iconClass="text-warning"
        />
      </div>
    </Link>
  );
}

function TeamStat({
  icon: Icon,
  value,
  label,
  iconClass,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  iconClass?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className={cn("size-3.5 shrink-0", iconClass ?? "text-muted-foreground")} />
      <span className="font-semibold tabular-nums text-foreground">{value}</span>
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TeamListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col rounded-xl border border-border bg-card p-5 animate-pulse"
        >
          <div className="mb-4 flex items-start gap-3">
            <div className="size-10 shrink-0 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2 pt-0.5">
              <div className="h-3.5 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          </div>
          <div className="mt-auto flex gap-4 border-t border-border/60 pt-3.5">
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="h-3 w-14 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  hasSearch,
  onClear,
  onCreate,
}: {
  hasSearch: boolean;
  onClear: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-xl border border-border bg-card">
        <Users className="size-7 text-muted-foreground" />
      </span>
      {hasSearch ? (
        <>
          <p className="text-sm font-medium text-foreground">No teams found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No results match your search. Try a different term.
          </p>
          <button
            onClick={onClear}
            className="mt-4 text-sm font-medium text-primary hover:underline underline-offset-4"
          >
            Clear search
          </button>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-foreground">No teams yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Create your first team to start collaborating with others.
          </p>
          <Button onClick={onCreate} className="mt-5 gap-1.5" size="default">
            <Plus className="size-4" />
            Create Team
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
      <p className="text-sm font-medium text-foreground">Failed to load teams</p>
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
