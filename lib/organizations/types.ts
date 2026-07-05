/**
 * Organization types matching DRF serializer output.
 * GET /api/v1/organizations/get-org/         → paginated list of OrganizationSummary
 * GET /api/v1/organizations/get-org-details/ → OrganizationSummary
 * GET /api/v1/organizations/get-org-members/ → paginated list of OrgMembership
 * GET /api/v1/governance/get-org-settings/   → OrgSettings
 */

export type OrganizationSummary = {
  id: string;
  name: string;
  owner: string;        // UUID
  owner_email: string;
  member_count: number;
  team_count: number;
  project_count: number;
};

/** The current user's role inside a specific organization. */
export type OrgRole = "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";

/** A single membership record returned by get-org-members. */
export type OrgMembership = {
  user: string;         // UUID
  user_email: string;
  role: OrgRole;
  joined_at: string;    // ISO datetime
};

/**
 * Full organization settings shape — mirrors OrganizationSettings model.
 * Returned by GET /api/v1/governance/get-org-settings/?org_id=<id>
 */
export type OrgSettings = {
  id: number;
  organization: string;   // UUID

  // Limits
  max_members: number;
  max_teams: number;
  max_projects: number;

  // Default role
  default_member_role: OrgRole;

  // Membership rules (booleans)
  allow_member_invites: boolean;
  allow_member_updates: boolean;
  allow_member_removal: boolean;
  allow_self_removal: boolean;

  // Creation controls
  allow_team_creation: boolean;
  allow_project_creation: boolean;

  // Role-based minimums
  invite_member_min_role: OrgRole;
  update_member_min_role: OrgRole;
  remove_member_min_role: OrgRole;
  create_team_min_role: OrgRole;
  create_project_min_role: OrgRole;

  // Approval rules
  require_approval_for_invites: boolean;
  require_approval_for_updates: boolean;
  require_approval_for_removal: boolean;
  require_approval_for_team: boolean;
  require_approval_for_project: boolean;

  created_at: string;
  updated_at: string;
};

/** Paginated list response wrapper from DRF + StandardPagination. */
export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    message: string;
    data: T[];
  };
};

/**
 * Activity log entry — lightweight shape used on the overview tab.
 * Full shape lives in core/api/serializers.py (ActivityLogListSerializer).
 */
export type ActivityLogEntry = {
  id: string;
  user_email: string | null;
  username: string;
  action: "CREATE" | "READ" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "ACCESS" | "FAILED";
  resource_type: string;
  resource_name: string;
  description: string;
  method: string;
  path: string;
  status_code: number;
  response_time_ms: number | null;
  timestamp: string;
};
