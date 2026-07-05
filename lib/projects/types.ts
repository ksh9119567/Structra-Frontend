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
  created_at: string;                // ISO datetime
};

/** The current user's role inside a specific project. */
export type ProjectRole = "OWNER" | "MANAGER" | "LEAD" | "CONTRIBUTOR" | "VIEWER";

/** A single membership record returned by get-project-members. */
export type ProjectMembership = {
  user: string;         // UUID
  user_email: string;
  role: ProjectRole;
  joined_at: string;    // ISO datetime
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

/**
 * Full project governance settings — mirrors the ProjectSettings model.
 * Returned by GET /api/v1/governance/get-project-settings/?project_id=<id>
 * Restricted to the project OWNER (and org owner) by the backend.
 */
export type ProjectSettings = {
  id: number;
  project: string; // UUID

  // Task rules
  allow_task_creation: boolean;
  allow_task_updates: boolean;
  allow_task_deletions: boolean;
  only_assignee_can_update_task: boolean;
  create_task_min_role: ProjectRole;
  update_task_min_role: ProjectRole;
  delete_task_min_role: ProjectRole;

  // Limits
  max_members: number;

  // Default role
  default_member_role: ProjectRole;

  // Role-based minimums
  invite_member_min_role: ProjectRole;
  update_member_min_role: ProjectRole;
  remove_member_min_role: ProjectRole;

  // Membership rules
  allow_member_invites: boolean;
  allow_member_updates: boolean;
  allow_member_removal: boolean;
  allow_self_removal: boolean;

  // Approval rules
  require_approval_for_invites: boolean;
  require_approval_for_updates: boolean;
  require_approval_for_removal: boolean;

  // Inheritance
  inherit_base_rules_from_team: boolean;
  inherit_base_rules_from_org: boolean;

  created_at: string;
  updated_at: string;
};
