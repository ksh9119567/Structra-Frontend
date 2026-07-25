"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Plus,
  Users,
  FolderKanban,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CreateTeamModal } from "@/features/teams/components/create-team-modal";
import { MembersTablePagination } from "@/features/shared/members/members-table-ui";
import type { TeamSummary } from "@/lib/teams/types";
import type { OrganizationSummary, OrgRole } from "@/lib/organizations/types";

const PAGE_SIZE = 12;

// ─── Types ────────────────────────────────────────────────────────────────────

type FetchState =
  | { status: "loading" }
  | { status: "success"; teams: TeamSummary[]; total: number }
  | { status: "error"; message: string };

type OrgTeamsTabProps = {
  org: OrganizationSummary;
  currentUserRole: OrgRole;
};

// ─── Role gate ────────────────────────────────────────────────────────────────
// Default org policy requires ADMIN to create a team; owners always qualify.

import { ORG_ROLE_LEVEL as ROLE_LEVEL } from "@/lib/roles";

// ─── Component ────────────────────────────────────────────────────────────────

export function OrgTeamsTab({ org, currentUserRole }: OrgTeamsTabProps) {
  const router = useRouter();
  const [fetchState, setFetchState] = React.useState<FetchState>({ status: "loading" });
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);

  const canCreateTeam = ROLE_LEVEL[currentUserRole] >= ROLE_LEVEL.ADMIN;

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when the search changes
  React.useEffect(() => { setPage(1); }, [debouncedSearch]);

  // Fetch teams
  const fetchTeams = React.useCallback(async () => {
    setFetchState({ status: "loading" });
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/organizations/${org.id}/teams?${params.toString()}`);
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
  }, [org.id, page, debouncedSearch]);

  React.useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const teams = fetchState.status === "success" ? fetchState.teams : [];
  const total = fetchState.status === "success" ? fetchState.total : 0;
  const isLoading = fetchState.status === "loading";
  const isError = fetchState.status === "error";
  const isEmpty = fetchState.status === "success" && teams.length === 0;
  const hasFilters = !!debouncedSearch;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

      {/* ── Toolbar ── */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {fetchState.status === "success" && (
            <p className="text-sm text-muted-foreground">
              {total} {total === 1 ? "team" : "teams"}
            </p>
          )}
          {canCreateTeam && (
            <Button size="default" className="gap-1.5 shrink-0" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Create Team
            </Button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {isLoading && <TeamGridSkeleton />}

      {isError && (
        <ErrorState
          message={(fetchState as { status: "error"; message: string }).message}
          onRetry={fetchTeams}
        />
      )}

      {isEmpty && (
        <EmptyState
          hasFilters={hasFilters}
          canCreate={canCreateTeam}
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

      {/* ── Create modal ── */}
      <CreateTeamModal
        open={createOpen}
        preselectedOrgId={org.id}
        preselectedOrgName={org.name}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          fetchTeams();
          router.refresh();
        }}
      />
    </div>
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

function TeamCard({ team }: { team: TeamSummary }) {
  const initial = team.name.charAt(0).toUpperCase();

  return (
    <Link
      href={`/teams/${team.id}`}
      prefetch={false}
      className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:bg-card/80 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-info/15 text-base font-bold text-info">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
              {team.name}
            </p>
          </div>
        </div>
        <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>

      {team.description ? (
        <p className="mb-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {team.description}
        </p>
      ) : (
        <p className="mb-3 text-xs italic text-muted-foreground/60">No description</p>
      )}

      <div className="mt-auto flex items-center gap-4 border-t border-border/60 pt-3.5">
        <TeamStat icon={Users} value={team.member_count} label="members" />
        <TeamStat icon={FolderKanban} value={team.project_count} label="projects" />
      </div>
    </Link>
  );
}

function TeamStat({
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

function TeamGridSkeleton() {
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
          <div className="mb-3 space-y-1.5">
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-2/3 rounded bg-muted" />
          </div>
          <div className="mt-auto flex gap-4 border-t border-border/60 pt-3.5">
            <div className="h-3 w-16 rounded bg-muted" />
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
        <Users className="size-7 text-muted-foreground" />
      </span>
      {hasFilters ? (
        <>
          <p className="text-sm font-medium text-foreground">No teams found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No teams match your search.
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
            {canCreate
              ? "Create the first team in this organization."
              : "No teams have been created in this organization yet."}
          </p>
          {canCreate && (
            <Button onClick={onCreate} className="mt-5 gap-1.5" size="default">
              <Plus className="size-4" />
              Create Team
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
