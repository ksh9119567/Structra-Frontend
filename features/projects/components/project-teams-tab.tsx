"use client";

import * as React from "react";
import { MoreHorizontal, UserPlus, Shield, Crown, UserMinus, Users } from "lucide-react";

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
import { MembersErrorState } from "@/features/shared/members/members-table-ui";
import { PROJECT_ROLE_LEVEL } from "@/lib/roles";
import type { ProjectRole, ProjectSummary, ProjectTeamLink } from "@/lib/projects/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type FetchState =
  | { status: "loading" }
  | { status: "success"; links: ProjectTeamLink[] }
  | { status: "error"; message: string };

type ProjectTeamsTabProps = {
  project: ProjectSummary;
  currentUserRole: ProjectRole;
  onAssignTeam?: () => void;
  onChangeTeamLink?: (link: ProjectTeamLink) => void;
  onUnassignTeam?: (link: ProjectTeamLink) => void;
  onTeamsResolved?: (teamIds: string[]) => void;
  /** Bump this value to force a re-fetch (e.g. after a mutation). */
  refreshKey?: number;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectTeamsTab({
  project,
  currentUserRole,
  onAssignTeam,
  onChangeTeamLink,
  onUnassignTeam,
  onTeamsResolved,
  refreshKey = 0,
}: ProjectTeamsTabProps) {
  const [fetchState, setFetchState] = React.useState<FetchState>({ status: "loading" });

  const isManagerOrAbove = PROJECT_ROLE_LEVEL[currentUserRole] >= PROJECT_ROLE_LEVEL.MANAGER;

  const fetchTeams = React.useCallback(async () => {
    setFetchState({ status: "loading" });
    try {
      const res = await fetch(`/api/projects/${project.id}/teams`);
      const data = await res.json();
      if (!res.ok) {
        setFetchState({ status: "error", message: data.message ?? "Failed to load teams." });
        return;
      }
      const links: ProjectTeamLink[] = Array.isArray(data) ? data : [];
      setFetchState({ status: "success", links });
      onTeamsResolved?.(links.map((l) => l.team));
    } catch {
      setFetchState({ status: "error", message: "Network error. Please try again." });
    }
  }, [project.id, onTeamsResolved]);

  React.useEffect(() => { fetchTeams(); }, [fetchTeams, refreshKey]);

  const links = fetchState.status === "success" ? fetchState.links : [];
  const isLoading = fetchState.status === "loading";
  const isError = fetchState.status === "error";
  const isEmpty = fetchState.status === "success" && links.length === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

      {/* ── Toolbar ── */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Assigned teams</p>
          <p className="text-xs text-muted-foreground">
            Team members inherit project access through their team's role — no need to add
            them individually.
          </p>
        </div>
        {isManagerOrAbove && (
          <Button size="default" className="gap-1.5 shrink-0" onClick={onAssignTeam}>
            <UserPlus className="size-4" />
            Assign Team
          </Button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[40%]">
                  Team
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Assigned by
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Assigned
                </th>
                <th className="w-10 px-4 py-3" aria-label="Actions" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => <TeamSkeletonRow key={i} />)}

              {!isLoading && !isError && !isEmpty &&
                links.map((link) => (
                  <TeamLinkRow
                    key={link.team}
                    link={link}
                    isManagerOrAbove={isManagerOrAbove}
                    onChangeTeamLink={onChangeTeamLink}
                    onUnassignTeam={onUnassignTeam}
                  />
                ))}
            </tbody>
          </table>
        </div>

        {isEmpty && (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <span className="mb-4 flex size-12 items-center justify-center rounded-xl border border-border bg-muted/50">
              <Users className="size-6 text-muted-foreground" />
            </span>
            <p className="text-sm font-medium text-foreground">No teams assigned</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Assign a team to grant its members access to this project through their team's
              role — nobody is copied into the member list.
            </p>
            {isManagerOrAbove && (
              <Button size="sm" className="mt-4 gap-1.5" onClick={onAssignTeam}>
                <UserPlus className="size-3.5" />
                Assign Team
              </Button>
            )}
          </div>
        )}

        {isError && (
          <MembersErrorState
            message={(fetchState as { status: "error"; message: string }).message}
            onRetry={fetchTeams}
          />
        )}
      </div>
    </div>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function TeamSkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="size-8 shrink-0 rounded-full bg-muted" />
          <div className="h-3.5 w-32 rounded bg-muted" />
        </div>
      </td>
      <td className="px-4 py-3"><div className="h-5 w-16 rounded-full bg-muted" /></td>
      <td className="px-4 py-3"><div className="h-3.5 w-24 rounded bg-muted" /></td>
      <td className="px-4 py-3"><div className="h-3.5 w-20 rounded bg-muted" /></td>
      <td className="px-4 py-3"><div className="size-7 rounded bg-muted" /></td>
    </tr>
  );
}

// ─── Team link row ────────────────────────────────────────────────────────────

type TeamLinkRowProps = {
  link: ProjectTeamLink;
  isManagerOrAbove: boolean;
  onChangeTeamLink?: (link: ProjectTeamLink) => void;
  onUnassignTeam?: (link: ProjectTeamLink) => void;
};

function TeamLinkRow({ link, isManagerOrAbove, onChangeTeamLink, onUnassignTeam }: TeamLinkRowProps) {
  const initials = link.team_name.slice(0, 2).toUpperCase();
  const assignedDate = new Date(link.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <tr className="group transition-colors hover:bg-accent/30">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-info/15 text-[11px] font-bold text-info">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{link.team_name}</p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <ProjectRoleBadge role={link.role} />
          {link.is_owning && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
              <Crown className="size-2.5" />
              Owning
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-3 text-xs text-muted-foreground">
        {link.assigned_by_email ?? "—"}
      </td>

      <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
        {assignedDate}
      </td>

      <td className="px-4 py-3">
        {isManagerOrAbove ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100"
                aria-label={`Actions for ${link.team_name}`}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">{link.team_name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onChangeTeamLink?.(link)}>
                <Shield className="size-4 text-muted-foreground" />
                Change role
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onUnassignTeam?.(link)}>
                <UserMinus className="size-4" />
                Unassign team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="size-7" />
        )}
      </td>
    </tr>
  );
}
