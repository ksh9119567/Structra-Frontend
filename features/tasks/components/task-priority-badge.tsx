import { cn } from "@/lib/utils";
import { type TaskPriority, TASK_PRIORITY_META } from "@/lib/tasks/types";

type TaskPriorityBadgeProps = {
  priority: TaskPriority;
  className?: string;
};

export function TaskPriorityBadge({ priority, className }: TaskPriorityBadgeProps) {
  const meta = TASK_PRIORITY_META[priority];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
