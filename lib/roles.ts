/**
 * Shared role ladder — mirrors core/constants/role_ladder.py on the backend.
 * CONTRIBUTOR (project) and MEMBER (org/team) are deliberately the same
 * rank: scope-specific synonyms for the same tier, not different levels.
 *
 * This is the single source of truth for role comparisons — component-local
 * ROLE_LEVEL maps should import from here instead of redeclaring, so adding
 * a role (e.g. GUEST) doesn't require hunting down every duplicate.
 */

import type { OrgRole } from "@/lib/organizations/types";
import type { TeamRole } from "@/lib/teams/types";
import type { ProjectRole } from "@/lib/projects/types";

export const ROLE_RANK = {
  GUEST: 0,
  VIEWER: 10,
  CONTRIBUTOR: 20,
  MEMBER: 20,
  LEAD: 30,
  MANAGER: 40,
  ADMIN: 50,
  OWNER: 100,
} as const;

export const ORG_ROLE_LEVEL: Record<OrgRole, number> = {
  OWNER: ROLE_RANK.OWNER,
  ADMIN: ROLE_RANK.ADMIN,
  MANAGER: ROLE_RANK.MANAGER,
  MEMBER: ROLE_RANK.MEMBER,
  VIEWER: ROLE_RANK.VIEWER,
};

export const TEAM_ROLE_LEVEL: Record<TeamRole, number> = {
  OWNER: ROLE_RANK.OWNER,
  MANAGER: ROLE_RANK.MANAGER,
  LEAD: ROLE_RANK.LEAD,
  MEMBER: ROLE_RANK.MEMBER,
  VIEWER: ROLE_RANK.VIEWER,
};

export const PROJECT_ROLE_LEVEL: Record<ProjectRole, number> = {
  OWNER: ROLE_RANK.OWNER,
  MANAGER: ROLE_RANK.MANAGER,
  LEAD: ROLE_RANK.LEAD,
  CONTRIBUTOR: ROLE_RANK.CONTRIBUTOR,
  VIEWER: ROLE_RANK.VIEWER,
  GUEST: ROLE_RANK.GUEST,
};

/**
 * Roles a team-project link may carry — mirrors TEAM_ASSIGNABLE_ROLES in
 * app/projects/api/v1/serializers.py. OWNER is excluded (a whole team
 * becoming "Owner" would conflict with the single permanent project Owner);
 * GUEST is excluded (an individual-explicit-member concept, not team-wide).
 */
export const TEAM_ASSIGNABLE_ROLES: ProjectRole[] = ["MANAGER", "LEAD", "CONTRIBUTOR", "VIEWER"];
