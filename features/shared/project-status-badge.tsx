import { cn } from "@/lib/utils";
import { type ProjectStatus, PROJECT_STATUS_META } from "@/lib/projects/types";

type ProjectStatusBadgeProps = {
  status: ProjectStatus;
  /** Show a pulsing dot for ACTIVE status. Defaults to true. */
  showDot?: boolean;
  className?: string;
};

export function ProjectStatusBadge({
  status,
  showDot = true,
  className,
}: ProjectStatusBadgeProps) {
  const meta = PROJECT_STATUS_META[status];
  const isActive = status === "ACTIVE";
  const isArchived = status === "ARCHIVED";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold",
        meta.className,
        isArchived && "line-through opacity-70",
        className,
      )}
    >
      {showDot && (
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            meta.dotClass,
            isActive && "animate-pulse",
          )}
        />
      )}
      {meta.label}
    </span>
  );
}
