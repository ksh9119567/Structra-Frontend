import { cn } from "@/lib/utils";
import type { ProjectRole } from "@/lib/projects/types";

const ROLE_STYLES: Record<ProjectRole, { label: string; className: string }> = {
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
  CONTRIBUTOR: {
    label: "Contributor",
    className: "bg-success/15 text-success",
  },
  VIEWER: {
    label: "Viewer",
    className: "bg-muted text-muted-foreground/70",
  },
};

type ProjectRoleBadgeProps = {
  role: ProjectRole;
  className?: string;
};

export function ProjectRoleBadge({ role, className }: ProjectRoleBadgeProps) {
  const style = ROLE_STYLES[role] ?? ROLE_STYLES.VIEWER;
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
