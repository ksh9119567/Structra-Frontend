# Structra — Backend Features & UI Specification

> Complete audit of all deployed backend features with corresponding UI design requirements,
> user flows, and API references. Use this as the source of truth when designing and building
> each frontend page.

---

## Table of Contents

1. [Role & Permission System](#1-role--permission-system)
2. [Authentication & Accounts](#2-authentication--accounts)
3. [Organizations](#3-organizations)
4. [Teams](#4-teams)
5. [Projects](#5-projects)
6. [Tasks](#6-tasks)
7. [Governance & Settings](#7-governance--settings)
8. [Activity Logs](#8-activity-logs)
9. [Page Checklist](#9-page-checklist)

---

## 1. Role & Permission System

### Organization Roles (hierarchy high → low)
| Role | Level | Description |
|------|-------|-------------|
| OWNER | 5 | Created the org. Full control. Cannot be removed. |
| ADMIN | 4 | Full control except deleting org |
| MANAGER | 3 | Manage teams/projects |
| MEMBER | 2 | Normal user |
| VIEWER | 1 | Read-only |

### Team Roles
| Role | Level | Description |
|------|-------|-------------|
| OWNER | 5 | Created the team |
| MANAGER | 4 | Manages team, invites members |
| LEAD | 3 | Can assign tasks, manage workflows |
| MEMBER | 2 | Normal team member |
| VIEWER | 1 | Read-only |

### Project Roles
| Role | Level | Description |
|------|-------|-------------|
| OWNER | 5 | Full control of project |
| MANAGER | 4 | Manage tasks and members |
| LEAD | 3 | Can assign tasks |
| CONTRIBUTOR | 2 | Can work on tasks |
| VIEWER | 1 | View only |

### Key Permission Rules
- You cannot modify a member with equal or higher role than yourself
- You cannot assign a role equal to or higher than your own
- Cannot remove the last ADMIN from an org / last MANAGER from a team/project
- Governance settings control minimum role required for each action (configurable per org/team/project)

---

## 2. Authentication & Accounts

### Features Implemented
- [x] Register with email, username, first/last name, password
- [x] Login with email + password (JWT — access + refresh tokens)
- [x] Logout (revokes tokens in Redis)
- [x] Token refresh
- [x] Get current user profile
- [x] Update profile (username, first_name, last_name, phone_number, profile_picture)
- [x] Delete account (soft delete)
- [x] OTP-based email/phone verification
- [x] OTP-based login
- [x] Forgot password (request OTP → verify OTP → reset password)

### API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/accounts/register/` | No | Register new user |
| POST | `/api/v1/accounts/login/` | No | Login, returns JWT |
| POST | `/api/v1/accounts/logout/` | Yes | Logout, revoke tokens |
| POST | `/api/v1/accounts/token/refresh/` | No | Refresh access token |
| GET | `/api/v1/accounts/get-user/` | Yes | Get current user |
| PUT | `/api/v1/accounts/update_user/` | Yes | Update profile |
| DELETE | `/api/v1/accounts/delete_user/` | Yes | Delete account |
| POST | `/api/v1/accounts/get-otp/` | No | Send OTP (email/phone) |
| POST | `/api/v1/accounts/verify-otp/` | No | Verify OTP |
| POST | `/api/v1/accounts/verify-otp/login/` | No | OTP-based login |
| POST | `/api/v1/accounts/forgot-password/request/` | No | Request password reset OTP |
| POST | `/api/v1/accounts/forgot-password/verify/` | No | Verify reset OTP → get token |
| PUT | `/api/v1/accounts/forgot-password/reset/` | No | Reset password with token |

### User Model Fields
```
id, email, username, first_name, last_name, profile_picture,
phone_number, is_email_verified, is_phone_verified,
is_active, is_staff, date_joined
```


---

## 3. Organizations

### Features Implemented
- [x] Create organization (unique name, auto-assigns creator as OWNER)
- [x] List user's organizations (paginated, filterable, searchable)
- [x] Get organization details (with member/team/project counts)
- [x] Update organization name (OWNER only)
- [x] Delete organization (soft delete, OWNER only)
- [x] List organization members (paginated, filterable by role)
- [x] Invite member by email (sends invite token, role-based permission)
- [x] Accept invite via token
- [x] Update member role (role hierarchy enforced)
- [x] Remove member (role-based permission)
- [x] Self-remove from organization
- [x] Transfer ownership to another member

### API Endpoints
| Method | Endpoint | Auth | Query Params | Body | Description |
|--------|----------|------|-------------|------|-------------|
| GET | `/api/v1/organizations/get-org/` | Yes | search, ordering | — | List my orgs |
| POST | `/api/v1/organizations/create-org/` | Yes | — | `{name}` | Create org |
| GET | `/api/v1/organizations/get-org-details/` | Yes | `org_id` | — | Get org details |
| GET | `/api/v1/organizations/get-org-members/` | Yes | `org_id` | — | List members |
| PUT | `/api/v1/organizations/update-org/` | Yes | `org_id` | `{name}` | Update org |
| DELETE | `/api/v1/organizations/delete-org/` | Yes | `org_id` | — | Delete org |
| POST | `/api/v1/organizations/sent-invite/` | Yes | `org_id` | `{email, role}` | Send invite |
| POST | `/api/v1/organizations/accept-org-invite/` | Yes | `invite_token` | — | Accept invite |
| PUT | `/api/v1/organizations/update-member/` | Yes | `org_id` | `{email, role}` | Update member role |
| DELETE | `/api/v1/organizations/remove-member/` | Yes | `org_id` | `{email}` | Remove member |
| DELETE | `/api/v1/organizations/self-remove-member/` | Yes | `org_id` | — | Leave org |
| PUT | `/api/v1/organizations/update-owner/` | Yes | `org_id` | `{email}` | Transfer ownership |

### Organization Response Shape
```json
{
  "id": "uuid",
  "name": "string",
  "owner": "uuid",
  "owner_email": "string",
  "member_count": 0,
  "team_count": 0,
  "project_count": 0
}
```

### Member Response Shape
```json
{
  "user": "uuid",
  "user_email": "string",
  "role": "OWNER|ADMIN|MANAGER|MEMBER|VIEWER",
  "joined_at": "datetime"
}
```

### UI Pages Required

#### 3.1 Organizations List Page (`/organizations`)
**Purpose:** Show all organizations the user belongs to.

**Layout:**
- Page header: "Organizations" + "Create Organization" button (top right)
- Search bar + filter by role
- Grid/list of organization cards
- Each card shows: org name, owner email, member count, team count, project count, user's role badge
- Empty state: "You're not part of any organization yet. Create one to get started."
- Loading skeleton state

**Actions:**
- Click card → navigate to org detail page
- "Create Organization" → opens create modal/drawer

#### 3.2 Create Organization Modal
**Fields:** Name (required, unique)
**Flow:** Submit → POST `/create-org/` → success toast → card appears in list

#### 3.3 Organization Detail Page (`/organizations/[id]`)
**Tabs:** Overview | Members | Teams | Projects | Settings (OWNER only)

**Overview tab:**
- Org name, owner, created date
- Stats: member count, team count, project count
- Quick actions: Invite Member, Create Team, Create Project (role-gated)

**Members tab:**
- Table: avatar, name/email, role badge, joined date, actions
- Actions per row (role-gated): Change Role dropdown, Remove button
- "Invite Member" button → invite modal
- Filter by role, search by email

**Invite Member Modal:**
- Email field + Role selector (ADMIN/MANAGER/MEMBER/VIEWER)
- Submit → POST `/sent-invite/` → shows invite token or sends email

**Change Role inline:**
- Dropdown with allowed roles (enforces hierarchy)
- PUT `/update-member/`

**Transfer Ownership:**
- Button in settings or member row for OWNER
- Confirmation dialog → PUT `/update-owner/`


---

## 4. Teams

### Features Implemented
- [x] Create team (optionally linked to an organization)
- [x] List user's teams (paginated, searchable)
- [x] List all teams in an organization
- [x] Get team details (with member/project counts)
- [x] Update team name/description (OWNER only)
- [x] Delete team (soft delete, OWNER only)
- [x] List team members (paginated)
- [x] Invite member by email (role-based permission)
- [x] Accept invite via token
- [x] Update member role (hierarchy enforced)
- [x] Remove member
- [x] Self-remove from team
- [x] Transfer team ownership

### API Endpoints
| Method | Endpoint | Auth | Query Params | Body | Description |
|--------|----------|------|-------------|------|-------------|
| GET | `/api/v1/teams/get-user-teams/` | Yes | search, ordering | — | List my teams |
| POST | `/api/v1/teams/create-team/` | Yes | — | `{name, description, organization_id?}` | Create team |
| GET | `/api/v1/teams/get-org-teams/` | Yes | `org_id` | — | Teams in an org |
| GET | `/api/v1/teams/get-team-details/` | Yes | `team_id` | — | Team details |
| GET | `/api/v1/teams/get-team-members/` | Yes | `team_id` | — | List members |
| PUT | `/api/v1/teams/update-team/` | Yes | — | `{team_id, name?, description?}` | Update team |
| DELETE | `/api/v1/teams/delete-team/` | Yes | — | `{team_id}` | Delete team |
| POST | `/api/v1/teams/sent-invite/` | Yes | — | `{team_id, email, role?}` | Send invite |
| POST | `/api/v1/teams/accept-team-invite/` | Yes | `invite_token` | — | Accept invite |
| PUT | `/api/v1/teams/update-member/` | Yes | `team_id` | `{email, role}` | Update member role |
| DELETE | `/api/v1/teams/remove-member/` | Yes | — | `{team_id, email}` | Remove member |
| DELETE | `/api/v1/teams/self-remove-member/` | Yes | `team_id` | — | Leave team |
| PUT | `/api/v1/teams/transfer-owner/` | Yes | `team_id` | `{email}` | Transfer ownership |

### Team Response Shape
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "organization": "uuid",
  "organization_name": "string",
  "created_by": "uuid",
  "created_by_email": "string",
  "member_count": 0,
  "project_count": 0,
  "created_at": "datetime"
}
```

### UI Pages Required

#### 4.1 Teams List Page (`/teams`)
**Layout:**
- Header: "Teams" + "Create Team" button
- Search + filter by organization
- Cards/table: team name, org badge, description, member count, project count, your role
- Empty state: "No teams yet."

#### 4.2 Create Team Modal/Drawer
**Fields:** Name (required), Description, Organization (optional dropdown of user's orgs)
**Flow:** POST `/create-team/` → success → navigate to team detail

#### 4.3 Team Detail Page (`/teams/[id]`)
**Tabs:** Overview | Members | Projects | Settings (OWNER only)

**Overview tab:**
- Team name, description, org link, created by, created date
- Stats: member count, project count
- Quick actions: Invite Member, Create Project (role-gated)

**Members tab:**
- Table: avatar, email, role badge, joined date, actions
- Role-gated: Change Role, Remove
- "Invite Member" button

**Projects tab:**
- List of projects belonging to this team
- "Create Project" button (role-gated)


---

## 5. Projects

### Features Implemented
- [x] Create project (linked to org and/or team, or standalone)
- [x] List user's projects (paginated, filterable, searchable)
- [x] List projects in an organization
- [x] List projects in a team
- [x] Get project details (with member count)
- [x] Update project (name, description, status, team assignment)
- [x] Delete project (soft delete, OWNER only)
- [x] List project members
- [x] Invite member by email (role-based)
- [x] Accept invite via token
- [x] Update member role
- [x] Remove member
- [x] Self-remove from project
- [x] Transfer project ownership

### Project Status Values
`PLANNING` | `ACTIVE` | `COMPLETED` | `ON_HOLD` | `ARCHIVED`

### API Endpoints
| Method | Endpoint | Auth | Query Params | Body | Description |
|--------|----------|------|-------------|------|-------------|
| GET | `/api/v1/projects/get-user-projects/` | Yes | search, ordering | — | My projects |
| POST | `/api/v1/projects/create-project/` | Yes | — | `{name, description, organization_id?, team_id?}` | Create project |
| GET | `/api/v1/projects/get_org-projects/` | Yes | `org_id` | — | Org's projects |
| GET | `/api/v1/projects/get-team-projects/` | Yes | `team_id` | — | Team's projects |
| GET | `/api/v1/projects/get-project-details/` | Yes | `project_id` | — | Project details |
| GET | `/api/v1/projects/get-project-members/` | Yes | `project_id` | — | Project members |
| PUT | `/api/v1/projects/update-project/` | Yes | `project_id` | `{name?, description?, status?, team_id?}` | Update project |
| DELETE | `/api/v1/projects/delete-project/` | Yes | `project_id` | — | Delete project |
| POST | `/api/v1/projects/send-invite/` | Yes | `project_id` | `{email, role?}` | Send invite |
| POST | `/api/v1/projects/accept-project-invite/` | Yes | `invite_token` | — | Accept invite |
| PUT | `/api/v1/projects/update-member/` | Yes | `project_id` | `{email, role}` | Update member role |
| DELETE | `/api/v1/projects/remove-member/` | Yes | `project_id` | `{email}` | Remove member |
| DELETE | `/api/v1/projects/self-remove-member/` | Yes | `project_id` | — | Leave project |
| PUT | `/api/v1/projects/transfer-owner/` | Yes | `project_id` | `{email}` | Transfer ownership |

### Project Response Shape
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "organization": "uuid",
  "organization_name": "string",
  "team": "uuid",
  "team_name": "string",
  "status": "PLANNING|ACTIVE|COMPLETED|ON_HOLD|ARCHIVED",
  "created_by": "uuid",
  "created_by_email": "string",
  "member_count": 0
}
```

### UI Pages Required

#### 5.1 Projects List Page (`/projects`)
**Layout:**
- Header: "Projects" + "Create Project" button
- Filter bar: status dropdown, org filter, team filter, search
- Cards/table: project name, status badge (color-coded), org/team badges, member count, your role
- Status badge colors: PLANNING=blue, ACTIVE=green, COMPLETED=gray, ON_HOLD=yellow, ARCHIVED=muted

**Status badge color map:**
- `PLANNING` → info/blue
- `ACTIVE` → success/green
- `COMPLETED` → muted/gray
- `ON_HOLD` → warning/yellow
- `ARCHIVED` → muted, strikethrough

#### 5.2 Create Project Modal/Drawer
**Fields:**
- Name (required)
- Description
- Organization (optional dropdown)
- Team (optional dropdown, filtered by selected org)
- Status (default: PLANNING)

**Flow:** POST `/create-project/` → success → navigate to project detail

#### 5.3 Project Detail Page (`/projects/[id]`)
**Tabs:** Overview | Tasks | Members | Settings (OWNER only)

**Overview tab:**
- Project name, description, status badge (editable inline for OWNER/MANAGER)
- Org/team links, created by, created date
- Stats: member count, task count by status
- Quick actions: Create Task, Invite Member (role-gated)

**Tasks tab:** (see Tasks section below)

**Members tab:**
- Table: avatar, email, role badge, joined date, actions
- Role-gated: Change Role, Remove
- "Invite Member" button


---

## 6. Tasks

### Features Implemented
- [x] Create task in a project (with optional parent task for subtasks)
- [x] List all tasks in a project (paginated, filterable, searchable, sortable)
- [x] Get task details
- [x] Update task (title, description, dates, status, priority, type, assignee)
- [x] Delete task (soft delete)
- [x] Subtask support (parent/child relationship, one level deep)
- [x] Assign task to a project member
- [x] Role-based task permissions (governed by ProjectSettings)

### Task Field Values

**Status:** `TO_DO` | `IN_PROGRESS` | `REVIEW` | `DONE` | `BLOCKED`

**Priority:** `LOW` | `MEDIUM` | `HIGH` | `URGENT`

**Type:** `BUG` | `FEATURE` | `IMPROVEMENT` | `DOCUMENTATION`

### API Endpoints
| Method | Endpoint | Auth | Query Params | Body | Description |
|--------|----------|------|-------------|------|-------------|
| GET | `/api/v1/tasks/get-project-tasks/` | Yes | `project_id`, filters | — | List project tasks |
| POST | `/api/v1/tasks/create-task/` | Yes | — | `{title, description, project_id, parent_id?}` | Create task |
| GET | `/api/v1/tasks/get_task_details/` | Yes | `task_id` | — | Task details |
| PUT | `/api/v1/tasks/update-task/` | Yes | `task_id` | `{title?, description?, start_date?, due_date?, status?, priority?, task_type?, assigned_to?}` | Update task |
| DELETE | `/api/v1/tasks/delete-task/` | Yes | `task_id` | — | Delete task |

### Task Filters (query params on list)
- `status` — filter by status
- `priority` — filter by priority
- `task_type` — filter by type
- `assigned_to` — filter by assignee UUID
- `search` — search title/description
- `ordering` — `created_at`, `due_date`, `priority`

### Task Response Shape
```json
{
  "id": "uuid",
  "project": "uuid",
  "project_name": "string",
  "parent": "uuid",
  "parent_task": "string",
  "title": "string",
  "description": "string",
  "start_date": "date",
  "due_date": "date",
  "status": "TO_DO|IN_PROGRESS|REVIEW|DONE|BLOCKED",
  "priority": "LOW|MEDIUM|HIGH|URGENT",
  "task_type": "BUG|FEATURE|IMPROVEMENT|DOCUMENTATION",
  "assigned_to": "uuid",
  "assigned_to_email": "string",
  "created_by_email": "string"
}
```

### UI Pages Required

#### 6.1 Tasks List Page (`/tasks`)
**Purpose:** All tasks assigned to the current user across all projects.

**Layout:**
- Header: "My Tasks"
- Filter bar: status, priority, type, project, due date range
- Table/kanban toggle
- Table columns: title, project, status badge, priority badge, type badge, assignee, due date
- Overdue tasks highlighted in red
- Empty state per filter

**Status badge colors:**
- `TO_DO` → muted
- `IN_PROGRESS` → info/blue
- `REVIEW` → warning/yellow
- `DONE` → success/green
- `BLOCKED` → destructive/red

**Priority badge colors:**
- `LOW` → muted
- `MEDIUM` → warning
- `HIGH` → orange
- `URGENT` → destructive/red

#### 6.2 Task Detail / Edit Drawer (slide-over panel)
Opens when clicking a task row. Does NOT navigate to a new page.

**Sections:**
- Title (editable inline)
- Description (editable, markdown-like textarea)
- Status selector (dropdown)
- Priority selector (dropdown)
- Type selector (dropdown)
- Assignee picker (member search dropdown)
- Start date / Due date pickers
- Parent task (read-only link if subtask)
- Subtasks list (if parent task)
- Created by, created at (read-only)
- Delete button (role-gated, bottom of panel)

#### 6.3 Create Task Modal
**Fields:** Title (required), Description, Project (required), Parent Task (optional), Priority, Type
**Flow:** POST `/create-task/` → task appears in list

#### 6.4 Kanban Board View (within Project Detail → Tasks tab)
**Columns:** TO_DO | IN_PROGRESS | REVIEW | DONE | BLOCKED
- Drag-and-drop cards between columns (calls PUT `/update-task/` with new status)
- Each card: title, priority badge, type icon, assignee avatar, due date
- "+ Add Task" button at bottom of each column
- Filter bar: assignee, priority, type


---

## 7. Governance & Settings

### Features Implemented
- [x] Organization settings (get + update, OWNER only)
- [x] Team settings (get + update, OWNER only)
- [x] Project settings (get + update, OWNER only)
- [x] Role-based minimum role configuration for all actions
- [x] Membership rules (allow/deny invites, updates, removals, self-removal)
- [x] Approval rules (require approval for invites, updates, removals)
- [x] Creation controls (allow team/project creation by non-owners)
- [x] Limits (max members, max teams, max projects)
- [x] Default member role on join
- [x] Settings inheritance (team can inherit from org, project can inherit from team/org)

### API Endpoints
| Method | Endpoint | Auth | Query Params | Body | Description |
|--------|----------|------|-------------|------|-------------|
| GET | `/api/v1/governance/get-org-settings/` | Yes (OWNER) | `org_id` | — | Get org settings |
| GET | `/api/v1/governance/get-team-settings/` | Yes (OWNER) | `team_id` | — | Get team settings |
| GET | `/api/v1/governance/get-project-settings/` | Yes (OWNER) | `project_id` | — | Get project settings |
| PUT | `/api/v1/governance/update-org-settings/` | Yes (OWNER) | `org_id` | partial settings | Update org settings |
| PUT | `/api/v1/governance/update-team-settings/` | Yes (OWNER) | `team_id` | partial settings | Update team settings |
| PUT | `/api/v1/governance/update-project-settings/` | Yes (OWNER) | `project_id` | partial settings | Update project settings |

### Organization Settings Fields
```
max_members (default: 50)
max_teams (default: 5)
max_projects (default: 10)
default_member_role (MEMBER)
allow_member_invites (false)
allow_member_updates (false)
allow_member_removal (false)
allow_self_removal (false)
allow_team_creation (false)
allow_project_creation (false)
invite_member_min_role (ADMIN)
update_member_min_role (ADMIN)
remove_member_min_role (ADMIN)
create_team_min_role (ADMIN)
create_project_min_role (ADMIN)
require_approval_for_invites (false)
require_approval_for_updates (false)
require_approval_for_removal (false)
require_approval_for_team (false)
require_approval_for_project (false)
```

### Team Settings Fields
```
max_members (default: 20)
max_projects (default: 10)
default_member_role (MEMBER)
allow_member_invites, allow_member_updates, allow_member_removal, allow_self_removal
allow_project_creation (false)
invite_member_min_role (MANAGER)
update_member_min_role (MANAGER)
remove_member_min_role (MANAGER)
create_project_min_role (MANAGER)
require_approval_for_invites, require_approval_for_updates, require_approval_for_removal
require_approval_for_project (false)
inherit_base_rules_from_org (false)
```

### Project Settings Fields
```
max_members (default: 20)
default_member_role (MEMBER)
allow_task_creation, allow_task_updates, allow_task_deletions (all true)
only_assignee_can_update_task (false)
create_task_min_role (MANAGER)
update_task_min_role (MANAGER)
delete_task_min_role (MANAGER)
invite_member_min_role (MANAGER)
update_member_min_role (MANAGER)
remove_member_min_role (MANAGER)
allow_member_invites, allow_member_updates, allow_member_removal, allow_self_removal
require_approval_for_invites, require_approval_for_updates, require_approval_for_removal
inherit_base_rules_from_team (false)
inherit_base_rules_from_org (false)
```

### UI Pages Required

#### 7.1 Organization Settings Tab (within Org Detail → Settings)
**Sections:**

**General:**
- Max members, max teams, max projects (number inputs)
- Default member role (dropdown)

**Membership Rules:**
- Toggle: Allow members to invite others
- Toggle: Allow members to update other members
- Toggle: Allow members to remove other members
- Toggle: Allow self-removal

**Creation Controls:**
- Toggle: Allow team creation by non-owners
- Toggle: Allow project creation by non-owners
- Min role for team creation (dropdown, only if toggle on)
- Min role for project creation (dropdown, only if toggle on)

**Role Permissions:**
- Min role to invite members (dropdown)
- Min role to update members (dropdown)
- Min role to remove members (dropdown)

**Approval Rules:**
- Toggle: Require approval for member invites
- Toggle: Require approval for member updates
- Toggle: Require approval for member removal
- Toggle: Require approval for team creation
- Toggle: Require approval for project creation

**Save button** → PUT `/update-org-settings/`

#### 7.2 Team Settings Tab (within Team Detail → Settings)
Same pattern as org settings but with team-specific fields.
Additional: "Inherit rules from organization" toggle.

#### 7.3 Project Settings Tab (within Project Detail → Settings)
Same pattern but with task-specific fields.
Additional: "Inherit from team" and "Inherit from org" toggles.


---

## 8. Activity Logs

### Features Implemented
- [x] Automatic activity tracking via middleware (every API request logged)
- [x] List activity logs (own logs for regular users, all logs for staff)
- [x] Get single activity log detail
- [x] My recent activities (last 50)
- [x] Activity statistics (by action, resource type, status code)
- [x] Filtering, searching, ordering
- [x] Pagination

### Tracked Actions
`CREATE` | `READ` | `UPDATE` | `DELETE` | `LOGIN` | `LOGOUT` | `ACCESS` | `FAILED`

### API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/activity-logs/` | Yes | List activity logs (paginated) |
| GET | `/api/v1/activity-logs/{id}/` | Yes | Single log detail |
| GET | `/api/v1/activity-logs/my_activities/` | Yes | My last 50 activities |
| GET | `/api/v1/activity-logs/stats/` | Yes | Activity statistics |

### Activity Log Filters
- `action` — CREATE/READ/UPDATE/DELETE/etc.
- `resource_type` — Organization/Project/Task/etc.
- `status_code` — HTTP status
- `search` — username, resource_type, resource_name, description, path
- `ordering` — timestamp, response_time_ms, status_code

### Activity Log Response Shape
```json
{
  "id": "uuid",
  "user_email": "string",
  "username": "string",
  "action": "CREATE|READ|UPDATE|DELETE|LOGIN|LOGOUT|ACCESS|FAILED",
  "resource_type": "string",
  "resource_id": "string",
  "resource_name": "string",
  "description": "string",
  "method": "GET|POST|PUT|DELETE",
  "path": "string",
  "status_code": 200,
  "response_time_ms": 45.2,
  "timestamp": "datetime"
}
```

### UI Pages Required

#### 8.1 Activity Page (`/activity`)
**Layout:**
- Header: "Activity Log"
- Stats row: total activities, by action counts, success/error breakdown
- Filter bar: action type, resource type, date range, search
- Timeline/table of activity entries
- Each entry: action icon (color-coded), description, resource link, timestamp, response time badge
- Click entry → detail drawer with full log info

**Action icon color map:**
- `CREATE` → success/green
- `UPDATE` → info/blue
- `DELETE` → destructive/red
- `LOGIN` / `LOGOUT` → primary/purple
- `FAILED` → destructive/red
- `READ` / `ACCESS` → muted

#### 8.2 Activity Detail Drawer
Shows full log: user, action, resource, HTTP method, path, query params, status code, response time, IP, timestamp.

---

## 9. Page Checklist

> **Status as of July 2026.** ✅ = built & wired to the backend · 🟡 = built but partial /
> mock in places · 🔜 = placeholder ("Coming Soon") screen only.

### Built & wired ✅
- [x] `/` — Marketing landing page
- [x] `/login` — Login page
- [x] `/signup` — Signup page
- [x] `/profile` — User profile edit (real API)
- [x] `/settings` — Account settings + password change (OTP-verified) + delete account
- [x] `/organizations` — Organizations list (create, search)
- [x] `/organizations/[id]` — Org detail: **Overview, Members, Settings** tabs wired
- [x] `/teams` — Teams list (create)
- [x] `/teams/[id]` — Team detail: Overview, Members, Projects, Settings tabs
- [x] `/projects` — Projects list (create, status filter)
- [x] `/projects/[id]` — Project detail: Overview, Members, **Tasks (Kanban)**, Settings tabs
- [x] `/tasks` — My Tasks list (cross-project) + task detail drawer

### Built but partial 🟡
- [~] `/dashboard` — Real summary stats, recent activity & my-tasks; **Pending Approvals card uses mock data**
- [~] `/organizations/[id]` → **Teams** and **Projects** sub-tabs are "Coming Soon" placeholders

### Placeholder only — needs backend or UI work 🔜
- [ ] `/activity` — "Coming Soon". Backend audit-log API exists; full feed/stats page not built yet
- [ ] `/approvals` — "Coming Soon". **No backend approval engine exists** — sidebar badge count is hardcoded
- [ ] OTP / passwordless login screen — backend supports it; no UI
- [ ] Email-verification prompt — backend tracks status; no UI

### Governance settings
Settings are edited **inside each detail page's Settings tab** (not separate routes):
- [x] Org settings tab · [x] Team settings tab · [x] Project settings tab
- ⚠️ Verify the backend settings-**update** endpoints end-to-end (they appear mapped to the
  wrong HTTP verb) before relying on saving governance in production.

### Shared components — all built ✅
- [x] `InviteMemberModal` (per org/team/project) · [x] `MembersTable` (role-gated actions)
- [x] `TaskDetailDrawer` · [x] `CreateTaskModal` · [x] `KanbanBoard`
- [x] Governance `settings-ui` toggle groups · [x] Role badges (org/team/project)
- [x] `ProjectStatusBadge`, `TaskStatusBadge`, `TaskPriorityBadge`
- [x] `ConfirmDialog` · [x] `StatCard` · [x] `FilterSelect` · [x] empty/loading states

---

## 10. Common Patterns & Notes

### Pagination
All list endpoints return:
```json
{
  "count": 100,
  "next": "url or null",
  "previous": "url or null",
  "results": { "message": "Success", "data": [...] }
}
```

### ID passing convention
- Most endpoints use **query params** for IDs on GET/DELETE: `?org_id=uuid`
- POST/PUT endpoints use **request body** for IDs: `{ "org_id": "uuid" }`
- Exception: accept invite uses `?invite_token=xxx` query param

### Error response shape
```json
{ "detail": "message" }
// or
{ "field_name": ["error message"] }
// or
{ "non_field_errors": ["message"] }
```

### Auth header
All authenticated requests need: `Authorization: Bearer <access_token>`
(Handled automatically by the BFF — browser never sends this directly)

### Soft deletes
Organizations, Teams, Projects, Tasks all use `is_deleted=True` for deletion.
They are filtered out of all list queries automatically.

### Invite flow
1. Inviter calls `sent-invite/` → backend generates token, stores in Redis, sends email
2. Invitee receives email with link containing `invite_token`
3. Invitee calls `accept-*-invite/?invite_token=xxx` → membership created

### Settings auto-creation
When an org/team/project is created, its settings object is automatically created with defaults via Django signals.
