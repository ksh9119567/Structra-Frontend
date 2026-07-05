import { cn } from "@/lib/utils";
import { type TaskStatus, TASK_STATUS_META } from "@/lib/tasks/types";

type TaskStatusBadgeProps = {
  status: TaskStatus;
  className?: string;
};

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  const meta = TASK_STATUS_META[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold",
        meta.className,
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", meta.dotClass)} />
      {meta.label}
    </span>
  );
}
