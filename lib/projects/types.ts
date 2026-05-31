/**
 * Project types matching DRF serializer output.
 * GET /api/v1/projects/get-user-projects/     → paginated list of ProjectSummary
 * GET /api/v1/projects/get-team-projects/     → paginated list of ProjectSummary
 * GET /api/v1/projects/get-project-details/   → ProjectSummary
 */

export type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "COMPLETED"
  | "ON_HOLD"
  | "ARCHIVED";

export type ProjectSummary = {
  id: string;
  name: string;
  description: string;
  organization: string | null;       // UUID or null
  organization_name: string | null;
  team: string | null;               // UUID or null
  team_name: string | null;
  status: ProjectStatus;
  created_by: string;                // UUID
  created_by_email: string;
  member_count: number;
};

/** Visual metadata for each project status — used by ProjectStatusBadge. */
export const PROJECT_STATUS_META: Record<
  ProjectStatus,
  { label: string; className: string; dotClass: string }
> = {
  PLANNING: {
    label: "Planning",
    className: "bg-info/15 text-info",
    dotClass: "bg-info",
  },
  ACTIVE: {
    label: "Active",
    className: "bg-success/15 text-success",
    dotClass: "bg-success",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-muted text-muted-foreground",
    dotClass: "bg-muted-foreground/50",
  },
  ON_HOLD: {
    label: "On Hold",
    className: "bg-warning/15 text-warning",
    dotClass: "bg-warning",
  },
  ARCHIVED: {
    label: "Archived",
    className: "bg-muted text-muted-foreground/60",
    dotClass: "bg-muted-foreground/30",
  },
};

export const ALL_PROJECT_STATUSES: ProjectStatus[] = [
  "PLANNING",
  "ACTIVE",
  "COMPLETED",
  "ON_HOLD",
  "ARCHIVED",
];
