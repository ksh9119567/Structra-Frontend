"use client";

import * as React from "react";
import {
  Search,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  MoreHorizontal,
  UserPlus,
  Shield,
  Crown,
  UserMinus,
  RefreshCw,
  AlertCircle,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OrgRoleBadge } from "./org-role-badge";
import type { OrgMembership, OrgRole, OrganizationSummary } from "@/lib/organizations/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const ORG_ROLES: OrgRole[] = ["OWNER", "ADMIN", "MANAGER", "MEMBER", "VIEWER"];
const PAGE_SIZE = 10;

// Role hierarchy — used to determine what actions the current user can take
const ROLE_LEVEL: Record<OrgRole, number> = {
  OWNER: 5, ADMIN: 4, MANAGER: 3, MEMBER: 2, VIEWER: 1,
};

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField = "role" | "joined_at";
type SortDir = "asc" | "desc";

type FetchState =
  | { status: "loading" }
  | { status: "success"; members: OrgMembership[]; total: number }
  | { status: "error"; message: string };

type OrgMembersTabProps = {
  org: OrganizationSummary;
  currentUserEmail: string;
  /** Called when "Invite Member" is clicked — wired in Screen 5 */
  onInvite?: () => void;
  /** Called when "Change Role" is clicked — wired in Screen 6 */
  onChangeRole?: (member: OrgMembership) => void;
  /** Called when "Transfer Ownership" is clicked — wired in Screen 7 */
  onTransferOwnership?: (member: OrgMembership) => void;
  /** Called when "Remove Member" is clicked — wired in Screen 6 */
  onRemoveMember?: (member: OrgMembership) => void;
  /** Fires once the current user's role is resolved from the member list */
  onCurrentUserRoleResolved?: (role: OrgRole) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function OrgMembersTab({
  org,
  currentUserEmail,
  onInvite,
  onChangeRole,
  onTransferOwnership,
  onRemoveMember,
  onCurrentUserRoleResolved,
}: OrgMembersTabProps) {
  const [fetchState, setFetchState] = React.useState<FetchState>({ status: "loading" });
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<OrgRole | "">("");
  const [sortField, setSortField] = React.useState<SortField>("joined_at");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [page, setPage] = React.useState(1);

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when filters change
  React.useEffect(() => { setPage(1); }, [debouncedSearch, roleFilter, sortField, sortDir]);

  // Fetch members
  const fetchMembers = React.useCallback(async () => {
    setFetchState({ status: "loading" });
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(PAGE_SIZE),
        ordering: `${sortDir === "desc" ? "-" : ""}${sortField}`,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (roleFilter) params.set("role", roleFilter);

      const res = await fetch(`/api/organizations/${org.id}/members?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setFetchState({ status: "error", message: data.message ?? "Failed to load members." });
        return;
      }

      const members: OrgMembership[] = data.results?.data ?? [];
      setFetchState({ status: "success", members, total: data.count ?? members.length });
    } catch {
      setFetchState({ status: "error", message: "Network error. Please try again." });
    }
  }, [org.id, page, debouncedSearch, roleFilter, sortField, sortDir]);

  React.useEffect(() => { fetchMembers(); }, [fetchMembers]);

  // Determine current user's role for permission checks
  const currentUserRole: OrgRole =
    fetchState.status === "success"
      ? (fetchState.members.find((m) => m.user_email === currentUserEmail)?.role ?? "VIEWER")
      : "VIEWER";

  const currentUserLevel = ROLE_LEVEL[currentUserRole];
  const isOwner = currentUserRole === "OWNER";
  const isAdminOrAbove = currentUserLevel >= ROLE_LEVEL.ADMIN;

  // Notify shell of resolved role (used by ChangeRoleModal)
  React.useEffect(() => {
    if (fetchState.status === "success") {
      onCurrentUserRoleResolved?.(currentUserRole);
    }
  }, [fetchState.status, currentUserRole, onCurrentUserRoleResolved]);

  const members = fetchState.status === "success" ? fetchState.members : [];
  const total = fetchState.status === "success" ? fetchState.total : 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isLoading = fetchState.status === "loading";
  const isError = fetchState.status === "error";
  const isEmpty = fetchState.status === "success" && members.length === 0;

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

      {/* ── Toolbar ── */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email…"
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

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as OrgRole | "")}
            className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
          >
            <option value="">All roles</option>
            {ORG_ROLES.map((r) => (
              <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>

        {/* Right side: count + invite button */}
        <div className="flex items-center gap-3">
          {fetchState.status === "success" && (
            <p className="text-sm text-muted-foreground">
              {total} {total === 1 ? "member" : "members"}
            </p>
          )}
          {isAdminOrAbove && (
            <Button size="default" className="gap-1.5 shrink-0" onClick={onInvite}>
              <UserPlus className="size-4" />
              Invite Member
            </Button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Table header */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[40%]">
                  Member
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <SortButton
                    label="Role"
                    field="role"
                    current={sortField}
                    dir={sortDir}
                    onToggle={toggleSort}
                  />
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <SortButton
                    label="Joined"
                    field="joined_at"
                    current={sortField}
                    dir={sortDir}
                    onToggle={toggleSort}
                  />
                </th>
                <th className="w-10 px-4 py-3" aria-label="Actions" />
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {/* Loading rows */}
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}

              {/* Data rows */}
              {!isLoading &&
                !isError &&
                !isEmpty &&
                members.map((member) => (
                  <MemberRow
                    key={member.user}
                    member={member}
                    isCurrentUser={member.user_email === currentUserEmail}
                    currentUserLevel={currentUserLevel}
                    isOwner={isOwner}
                    onChangeRole={onChangeRole}
                    onTransferOwnership={onTransferOwnership}
                    onRemoveMember={onRemoveMember}
                  />
                ))}
            </tbody>
          </table>
        </div>

        {/* Empty state — inside the table container */}
        {isEmpty && (
          <EmptyState
            hasFilters={!!debouncedSearch || !!roleFilter}
            onClear={() => { setSearch(""); setRoleFilter(""); }}
            onInvite={isAdminOrAbove ? onInvite : undefined}
          />
        )}

        {/* Error state */}
        {isError && (
          <ErrorState
            message={(fetchState as { status: "error"; message: string }).message}
            onRetry={fetchMembers}
          />
        )}

        {/* Pagination footer */}
        {!isLoading && !isError && !isEmpty && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
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
                onClick={() => setPage((p) => p + 1)}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Member Row ───────────────────────────────────────────────────────────────

type MemberRowProps = {
  member: OrgMembership;
  isCurrentUser: boolean;
  currentUserLevel: number;
  isOwner: boolean;
  onChangeRole?: (m: OrgMembership) => void;
  onTransferOwnership?: (m: OrgMembership) => void;
  onRemoveMember?: (m: OrgMembership) => void;
};

function MemberRow({
  member,
  isCurrentUser,
  currentUserLevel,
  isOwner,
  onChangeRole,
  onTransferOwnership,
  onRemoveMember,
}: MemberRowProps) {
  const targetLevel = ROLE_LEVEL[member.role];
  // Can act on this member only if current user outranks them
  const canAct = currentUserLevel > targetLevel && !isCurrentUser;
  const canTransfer = isOwner && member.role !== "OWNER";
  const canRemove = canAct;
  const canChangeRole = canAct;
  const hasAnyAction = canChangeRole || canTransfer || canRemove;

  const initials = member.user_email
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  const joinedDate = new Date(member.joined_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <tr className="group transition-colors hover:bg-accent/30">
      {/* Member identity */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {member.user_email}
              {isCurrentUser && (
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  you
                </span>
              )}
            </p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-4 py-3">
        <OrgRoleBadge role={member.role} />
      </td>

      {/* Status */}
      <td className="hidden px-4 py-3 md:table-cell">
        <span className="inline-flex items-center gap-1.5 text-xs text-success">
          <span className="size-1.5 rounded-full bg-success" />
          Active
        </span>
      </td>

      {/* Joined date */}
      <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
        {joinedDate}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        {hasAnyAction ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100"
                aria-label={`Actions for ${member.user_email}`}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">
                {member.user_email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {canChangeRole && (
                <DropdownMenuItem onClick={() => onChangeRole?.(member)}>
                  <Shield className="size-4 text-muted-foreground" />
                  Change role
                </DropdownMenuItem>
              )}

              {canTransfer && (
                <DropdownMenuItem onClick={() => onTransferOwnership?.(member)}>
                  <Crown className="size-4 text-muted-foreground" />
                  Transfer ownership
                </DropdownMenuItem>
              )}

              {(canChangeRole || canTransfer) && canRemove && (
                <DropdownMenuSeparator />
              )}

              {canRemove && (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onRemoveMember?.(member)}
                >
                  <UserMinus className="size-4" />
                  Remove member
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          // Placeholder to keep column width stable
          <div className="size-7" />
        )}
      </td>
    </tr>
  );
}

// ─── Sort Button ──────────────────────────────────────────────────────────────

function SortButton({
  label,
  field,
  current,
  dir,
  onToggle,
}: {
  label: string;
  field: SortField;
  current: SortField;
  dir: SortDir;
  onToggle: (f: SortField) => void;
}) {
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

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
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

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  hasFilters,
  onClear,
  onInvite,
}: {
  hasFilters: boolean;
  onClear: () => void;
  onInvite?: () => void;
}) {
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
            Invite people to join this organization.
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

// ─── Error State ──────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
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
