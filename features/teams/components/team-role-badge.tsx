import { cn } from "@/lib/utils";
import type { TeamRole } from "@/lib/teams/types";

const ROLE_STYLES: Record<TeamRole, { label: string; className: string }> = {
  OWNER: {
    label: "Owner",
    className: "bg-primary/15 text-primary",
  },
  MANAGER: {
    label: "Manager",
    className: "bg-info/15 text-info",
  },
  LEAD: {
    label: "Lead",
    className: "bg-warning/15 text-warning",
  },
  MEMBER: {
    label: "Member",
    className: "bg-muted text-muted-foreground",
  },
  VIEWER: {
    label: "Viewer",
    className: "bg-muted text-muted-foreground/70",
  },
};

type TeamRoleBadgeProps = {
  role: TeamRole;
  className?: string;
};

export function TeamRoleBadge({ role, className }: TeamRoleBadgeProps) {
  const style = ROLE_STYLES[role] ?? ROLE_STYLES.MEMBER;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
        style.className,
        className,
      )}
    >
      {style.label}
    </span>
  );
}
