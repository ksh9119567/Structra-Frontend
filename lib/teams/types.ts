/**
 * Team types matching DRF serializer output.
 * GET /api/v1/teams/get-user-teams/        → paginated list of TeamSummary
 * GET /api/v1/teams/get-team-details/      → TeamSummary
 * GET /api/v1/teams/get-team-members/      → paginated list of TeamMembership
 * GET /api/v1/governance/get-team-settings/ → TeamSettings
 */

export type TeamSummary = {
  id: string;
  name: string;
  description: string;
  organization: string | null;   // UUID or null (standalone team)
  organization_name: string | null;
  created_by: string;            // UUID
  created_by_email: string;
  member_count: number;
  project_count: number;
  created_at: string;            // ISO datetime
};

/** The current user's role inside a specific team. */
export type TeamRole = "OWNER" | "MANAGER" | "LEAD" | "MEMBER" | "VIEWER";

/** A single membership record returned by get-team-members. */
export type TeamMembership = {
  user: string;         // UUID
  user_email: string;
  role: TeamRole;
  joined_at: string;    // ISO datetime
};

/**
 * Full team settings shape — mirrors TeamSettings model.
 * Returned by GET /api/v1/governance/get-team-settings/?team_id=<id>
 */
export type TeamSettings = {
  id: number;
  team: string;   // UUID

  // Limits
  max_members: number;
  max_projects: number;

  // Default role
  default_member_role: TeamRole;

  // Membership rules
  allow_member_invites: boolean;
  allow_member_updates: boolean;
  allow_member_removal: boolean;
  allow_self_removal: boolean;

  // Creation controls
  allow_project_creation: boolean;

  // Role-based minimums
  invite_member_min_role: TeamRole;
  update_member_min_role: TeamRole;
  remove_member_min_role: TeamRole;
  create_project_min_role: TeamRole;

  // Approval rules
  require_approval_for_invites: boolean;
  require_approval_for_updates: boolean;
  require_approval_for_removal: boolean;
  require_approval_for_project: boolean;

  // Inheritance
  inherit_base_rules_from_org: boolean;

  created_at: string;
  updated_at: string;
};
