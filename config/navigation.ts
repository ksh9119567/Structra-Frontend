import {
  LayoutDashboard,
  Building2,
  Users,
  FolderKanban,
  SquareCheckBig,
  ShieldCheck,
  Activity,
  Settings,
  type LucideIcon,
} from "lucide-react";

/**
 * A single primary navigation destination shown in the sidebar.
 * `href` is matched against the current pathname to derive the active state.
 */
export type NavItem = {
  /** Stable identifier, also used as the matcher segment. */
  key: string;
  /** Visible label. */
  label: string;
  /** Target route. */
  href: string;
  /** Lucide icon rendered in both expanded and collapsed (rail) states. */
  icon: LucideIcon;
  /** Optional count badge (e.g. pending approvals). */
  badge?: number;
};

export type NavSection = {
  /** Section heading, hidden when the sidebar is collapsed. */
  heading?: string;
  items: NavItem[];
};

/**
 * Primary sidebar navigation for the Structra application shell.
 *
 * Order and grouping are intentional: day-to-day work surfaces sit at the top,
 * governance / administration sits at the bottom. Hrefs are illustrative — the
 * shell is route-agnostic and only needs the prefix to compute active state.
 */
export const PRIMARY_NAV: NavSection[] = [
  {
    items: [
      { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { key: "organizations", label: "Organizations", href: "/organizations", icon: Building2 },
      { key: "teams", label: "Teams", href: "/teams", icon: Users },
      { key: "projects", label: "Projects", href: "/projects", icon: FolderKanban },
      { key: "tasks", label: "Tasks", href: "/tasks", icon: SquareCheckBig },
    ],
  },
  {
    heading: "Governance",
    items: [
      { key: "approvals", label: "Approvals", href: "/approvals", icon: ShieldCheck, badge: 3 },
      { key: "activity", label: "Activity", href: "/activity", icon: Activity },
    ],
  },
  {
    heading: "Workspace",
    items: [{ key: "settings", label: "Settings", href: "/settings", icon: Settings }],
  },
];

/** Width tokens for the sidebar in its two states (px). Keep in sync with CSS. */
export const SIDEBAR_WIDTH = {
  expanded: 248,
  collapsed: 64,
} as const;
