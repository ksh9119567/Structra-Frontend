"use client";

import * as React from "react";
import {
  Building2,
  Plus,
  Search,
  Users,
  FolderKanban,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { OrganizationSummary } from "@/lib/organizations/types";
import { CreateOrganizationModal } from "./create-organization-modal";
import { OrgRoleBadge } from "./org-role-badge";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; orgs: OrganizationSummary[]; total: number }
  | { status: "error"; message: string };

// ─── Main View ────────────────────────────────────────────────────────────────

export function OrganizationsView() {
  const [fetchState, setFetchState] = React.useState<FetchState>({ status: "idle" });
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);

  // Debounce search input
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch organizations
  const fetchOrgs = React.useCallback(async (searchTerm: string) => {
    setFetchState({ status: "loading" });
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      const res = await fetch(`/api/organizations?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setFetchState({ status: "error", message: data.message ?? "Failed to load organizations." });
        return;
      }

      const orgs: OrganizationSummary[] = data.results?.data ?? [];
      setFetchState({ status: "success", orgs, total: data.count ?? orgs.length });
    } catch {
      setFetchState({ status: "error", message: "Network error. Please try again." });
    }
  }, []);

  React.useEffect(() => {
    fetchOrgs(debouncedSearch);
  }, [debouncedSearch, fetchOrgs]);

  function handleCreated(org: OrganizationSummary) {
    setCreateOpen(false);
    // Optimistically prepend the new org
    setFetchState((prev) => {
      if (prev.status !== "success") return prev;
      return {
        ...prev,
        orgs: [org, ...prev.orgs],
        total: prev.total + 1,
      };
    });
  }

  const orgs = fetchState.status === "success" ? fetchState.orgs : [];
  const isLoading = fetchState.status === "loading" || fetchState.status === "idle";
  const isError = fetchState.status === "error";
  const isEmpty = fetchState.status === "success" && orgs.length === 0;

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Page header ── */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Organizations
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your organizations, teams, and members.
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="shrink-0 gap-1.5"
            size="default"
          >
            <Plus className="size-4" />
            Create Organization
          </Button>
        </div>

        {/* ── Filters ── */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search organizations…"
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

          {/* Result count */}
          {fetchState.status === "success" && (
            <p className="text-sm text-muted-foreground sm:ml-auto">
              {fetchState.total === 1
                ? "1 organization"
                : `${fetchState.total} organizations`}
            </p>
          )}
        </div>

        {/* ── Content ── */}
        {isLoading && <OrgListSkeleton />}
        {isError && (
          <ErrorState
            message={(fetchState as { status: "error"; message: string }).message}
            onRetry={() => fetchOrgs(debouncedSearch)}
          />
        )}
        {isEmpty && <EmptyState hasSearch={!!debouncedSearch} onClear={() => setSearch("")} onCreate={() => setCreateOpen(true)} />}
        {!isLoading && !isError && !isEmpty && (
          <OrgGrid orgs={orgs} />
        )}
      </div>

      <CreateOrganizationModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}

// ─── Org Grid ─────────────────────────────────────────────────────────────────

function OrgGrid({ orgs }: { orgs: OrganizationSummary[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {orgs.map((org) => (
        <OrgCard key={org.id} org={org} />
      ))}
    </div>
  );
}

// ─── Org Card ─────────────────────────────────────────────────────────────────

function OrgCard({ org }: { org: OrganizationSummary }) {
  const initial = org.name.charAt(0).toUpperCase();

  return (
    <Link
      href={`/organizations/${org.id}`}
      prefetch={false}
      className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:bg-card/80 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      {/* Card header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Org avatar */}
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-base font-bold text-primary">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {org.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">{org.owner_email}</p>
          </div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary mt-0.5" />
      </div>

      {/* Stats row */}
      <div className="mt-auto flex items-center gap-4 border-t border-border/60 pt-3.5">
        <OrgStat icon={Users} value={org.member_count} label="members" />
        <div className="h-3 w-px bg-border/60" />
        <OrgStat icon={Users} value={org.team_count} label="teams" iconClass="text-info" />
        <div className="h-3 w-px bg-border/60" />
        <OrgStat icon={FolderKanban} value={org.project_count} label="projects" iconClass="text-warning" />
      </div>
    </Link>
  );
}

function OrgStat({
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

function OrgListSkeleton() {
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
            <div className="h-3 w-12 rounded bg-muted" />
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
        <Building2 className="size-7 text-muted-foreground" />
      </span>
      {hasSearch ? (
        <>
          <p className="text-sm font-medium text-foreground">No organizations found</p>
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
          <p className="text-sm font-medium text-foreground">No organizations yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Create your first organization to start managing teams, projects, and members.
          </p>
          <Button onClick={onCreate} className="mt-5 gap-1.5" size="default">
            <Plus className="size-4" />
            Create Organization
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
      <p className="text-sm font-medium text-foreground">Failed to load organizations</p>
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
