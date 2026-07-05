import { cn } from "@/lib/utils";
import type { OrgRole } from "@/lib/organizations/types";

const ROLE_STYLES: Record<OrgRole, { label: string; className: string }> = {
  OWNER: {
    label: "Owner",
    className: "bg-primary/15 text-primary",
  },
  ADMIN: {
    label: "Admin",
    className: "bg-info/15 text-info",
  },
  MANAGER: {
    label: "Manager",
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

type OrgRoleBadgeProps = {
  role: OrgRole;
  className?: string;
};

export function OrgRoleBadge({ role, className }: OrgRoleBadgeProps) {
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
