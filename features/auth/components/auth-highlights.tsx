import * as React from "react";
import {
  BarChart3,
  ClipboardList,
  ShieldCheck,
  Users,
} from "lucide-react";

type Highlight = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
};

const HIGHLIGHTS: Highlight[] = [
  {
    icon: ClipboardList,
    title: "Task Management",
    description: "Organize and prioritize work",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Work together seamlessly",
  },
  {
    icon: ShieldCheck,
    title: "Governance & Compliance",
    description: "Built-in policies and approvals",
  },
  {
    icon: BarChart3,
    title: "Real-time Insights",
    description: "Data-driven decision making",
  },
];

export function AuthHighlights({ className }: { className?: string }) {
  return (
    <ul className={className}>
      {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
        <li key={title} className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <Icon className="size-4.5" />
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{title}</span>
            <span className="text-xs text-muted-foreground">{description}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
