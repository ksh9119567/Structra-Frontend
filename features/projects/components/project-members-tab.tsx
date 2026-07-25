"use client";

import * as React from "react";
import {
  MoreHorizontal,
  UserPlus,
  Shield,
  Crown,
  UserMinus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectRoleBadge } from "./project-role-badge";
import {
  MemberSearchBar,
  RoleFilterSelect,
  SortButton,
  MemberSkeletonRow,
  MembersEmptyState,
  MembersErrorState,
  MembersTablePagination,
} from "@/features/shared/members/members-table-ui";
import type { ProjectMembership, ProjectRole, ProjectSummary } from "@/lib/projects/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const PROJECT_ROLES: ProjectRole[] = ["OWNER", "MANAGER", "LEAD", "CONTRIBUTOR", "VIEWER", "GUEST"];
const PAGE_SIZE = 10;

import { PROJECT_ROLE_LEVEL as ROLE_LEVEL } from "@/lib/roles";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField = "role" | "joined_at";
type SortDir = "asc" | "desc";

type FetchState =
  | { status: "loading" }
  | { status: "success"; members: ProjectMembership[]; total: number }
  | { status: "error"; message: string };

type ProjectMembersTabProps = {
  project: ProjectSummary;
  currentUserEmail: string;
  onInvite?: () => void;
  onChangeRole?: (member: ProjectMembership) => void;
  onTransferOwnership?: (member: ProjectMembership) => void;
  onRemoveMember?: (member: ProjectMembership) => void;
  onCurrentUserRoleResolved?: (role: ProjectRole) => void;
  /** Bump this value to force a re-fetch of the members list (e.g. after a mutation). */
  refreshKey?: number;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectMembersTab({
  project,
  currentUserEmail,
  onInvite,
  onChangeRole,
  onTransferOwnership,
  onRemoveMember,
  onCurrentUserRoleResolved,
  refreshKey = 0,
}: ProjectMembersTabProps) {
  const [fetchState, setFetchState] = React.useState<FetchState>({ status: "loading" });
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<ProjectRole | "">("");
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

      const res = await fetch(`/api/projects/${project.id}/members?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setFetchState({ status: "error", message: data.message ?? "Failed to load members." });
        return;
      }

      const members: ProjectMembership[] = data.results?.data ?? [];
      setFetchState({ status: "success", members, total: data.count ?? members.length });
    } catch {
      setFetchState({ status: "error", message: "Network error. Please try again." });
    }
  }, [project.id, page, debouncedSearch, roleFilter, sortField, sortDir]);

  React.useEffect(() => { fetchMembers(); }, [fetchMembers, refreshKey]);

  // Resolve current user's role
  const currentUserRole: ProjectRole =
    fetchState.status === "success"
      ? (fetchState.members.find((m) => m.user_email === currentUserEmail)?.role ?? "VIEWER")
      : "VIEWER";

  const currentUserLevel = ROLE_LEVEL[currentUserRole];
  const isOwner = currentUserRole === "OWNER";
  const isManagerOrAbove = currentUserLevel >= ROLE_LEVEL.MANAGER;

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
          <MemberSearchBar value={search} onChange={setSearch} />
          <RoleFilterSelect<ProjectRole>
            value={roleFilter}
            onChange={setRoleFilter}
            roles={PROJECT_ROLES}
          />
        </div>
        <div className="flex items-center gap-3">
          {fetchState.status === "success" && (
            <p className="text-sm text-muted-foreground">
              {total} {total === 1 ? "member" : "members"}
            </p>
          )}
          {isManagerOrAbove && (
            <Button size="default" className="gap-1.5 shrink-0" onClick={onInvite}>
              <UserPlus className="size-4" />
              Invite Member
            </Button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[40%]">
                  Member
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <SortButton<SortField>
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
                  <SortButton<SortField>
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
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => <MemberSkeletonRow key={i} />)}

              {!isLoading && !isError && !isEmpty &&
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

        {isEmpty && (
          <MembersEmptyState
            hasFilters={!!debouncedSearch || !!roleFilter}
            onClear={() => { setSearch(""); setRoleFilter(""); }}
            onInvite={isManagerOrAbove ? onInvite : undefined}
            context="project"
          />
        )}

        {isError && (
          <MembersErrorState
            message={(fetchState as { status: "error"; message: string }).message}
            onRetry={fetchMembers}
          />
        )}

        {!isLoading && !isError && !isEmpty && (
          <MembersTablePagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={PAGE_SIZE}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
          />
        )}
      </div>
    </div>
  );
}

// ─── Member Row ───────────────────────────────────────────────────────────────

type MemberRowProps = {
  member: ProjectMembership;
  isCurrentUser: boolean;
  currentUserLevel: number;
  isOwner: boolean;
  onChangeRole?: (m: ProjectMembership) => void;
  onTransferOwnership?: (m: ProjectMembership) => void;
  onRemoveMember?: (m: ProjectMembership) => void;
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
  const canAct = currentUserLevel > targetLevel && !isCurrentUser;
  const canTransfer = isOwner && member.role !== "OWNER";
  const canRemove = canAct;
  const canChangeRole = canAct;
  const hasAnyAction = canChangeRole || canTransfer || canRemove;

  const initials = member.user_email.split("@")[0].slice(0, 2).toUpperCase();
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
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-info/15 text-[11px] font-bold text-info">
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
        <ProjectRoleBadge role={member.role} />
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
              <DropdownMenuLabel className="text-xs">{member.user_email}</DropdownMenuLabel>
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

              {(canChangeRole || canTransfer) && canRemove && <DropdownMenuSeparator />}

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
          <div className="size-7" />
        )}
      </td>
    </tr>
  );
}
