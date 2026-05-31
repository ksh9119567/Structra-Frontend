/**
 * Mock data for the application shell.
 *
 * The shell is a presentational/reusable layer, so it ships with realistic
 * sample data to demonstrate populated, loading, and empty states. In the real
 * app these shapes would be fed by the API layer / server components.
 */

export type Organization = {
  id: string;
  name: string;
  slug: string;
  plan: "Free" | "Team" | "Enterprise";
};

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  /** Optional avatar URL. When absent the UI falls back to initials. */
  avatarUrl?: string;
};

export type NotificationKind = "approval" | "mention" | "system" | "task";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  /** ISO timestamp. */
  createdAt: string;
  read: boolean;
};

export const ORGANIZATIONS: Organization[] = [
  { id: "org_1", name: "Acme Corp", slug: "acme", plan: "Enterprise" },
  { id: "org_2", name: "Globex", slug: "globex", plan: "Team" },
  { id: "org_3", name: "Initech", slug: "initech", plan: "Free" },
];

export const CURRENT_USER: CurrentUser = {
  id: "user_1",
  name: "Jordan Rivera",
  email: "jordan@acme.com",
};

export const NOTIFICATIONS: AppNotification[] = [
  {
    id: "n_1",
    kind: "approval",
    title: "Approval requested",
    description: "Mara Lin requested approval on “Q3 Budget Reallocation”.",
    createdAt: "2026-05-30T09:12:00Z",
    read: false,
  },
  {
    id: "n_2",
    kind: "mention",
    title: "You were mentioned",
    description: "Devon tagged you in a comment on STR-481.",
    createdAt: "2026-05-30T08:40:00Z",
    read: false,
  },
  {
    id: "n_3",
    kind: "task",
    title: "Task assigned",
    description: "“Audit access policies” was assigned to you.",
    createdAt: "2026-05-29T17:05:00Z",
    read: false,
  },
  {
    id: "n_4",
    kind: "system",
    title: "Policy updated",
    description: "Governance policy “Data Retention” changed to v4.",
    createdAt: "2026-05-29T11:22:00Z",
    read: true,
  },
];
