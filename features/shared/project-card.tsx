"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Users, Building2, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { ProjectStatusBadge } from "@/features/shared/project-status-badge";
import type { ProjectSummary } from "@/lib/projects/types";

// ─── Project Card ─────────────────────────────────────────────────────────────

type ProjectCardProps = {
  project: ProjectSummary;
  /** Show the organization/team/personal context badge. Defaults to true. */
  showContext?: boolean;
};

export function ProjectCard({ project, showContext = true }: ProjectCardProps) {
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
      {/* Card header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Project avatar */}
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg text-base font-bold",
              isArchived
                ? "bg-muted text-muted-foreground"
                : "bg-warning/15 text-warning",
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
          </div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary mt-0.5" />
      </div>

      {/* Status + context badges */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ProjectStatusBadge status={project.status} />
        {showContext && <ProjectContextBadge project={project} />}
      </div>

      {/* Description */}
      {project.description && (
        <p className="mb-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {project.description}
        </p>
      )}

      {/* Stats footer */}
      <div className="mt-auto flex items-center gap-3 border-t border-border/60 pt-3.5">
        <ProjectStat icon={Users} value={project.member_count} label="members" />
      </div>
    </Link>
  );
}

// ─── Context Badge ────────────────────────────────────────────────────────────

function ProjectContextBadge({ project }: { project: ProjectSummary }) {
  if (project.team && project.team_name) {
    return (
      <span
        onClick={(e) => e.preventDefault()}
        className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
        title={`Part of ${project.team_name}`}
      >
        <Users className="size-3 shrink-0" />
        <span className="truncate max-w-[140px]">{project.team_name}</span>
        {project.team_role && (
          <span className="text-muted-foreground/60">
            · {project.team_role.charAt(0) + project.team_role.slice(1).toLowerCase()}
          </span>
        )}
      </span>
    );
  }

  if (project.organization && project.organization_name) {
    return (
      <span
        onClick={(e) => e.preventDefault()}
        className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
        title={`Part of ${project.organization_name}`}
      >
        <Building2 className="size-3 shrink-0" />
        <span className="truncate max-w-[140px]">{project.organization_name}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground/60">
      <User className="size-3 shrink-0" />
      Personal
    </span>
  );
}

// ─── Stat ─────────────────────────────────────────────────────────────────────

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
