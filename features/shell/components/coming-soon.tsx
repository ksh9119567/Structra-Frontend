import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

type ComingSoonProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
};

export function ComingSoon({ title, description, icon: Icon }: ComingSoonProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      {/* Icon cluster */}
      <div className="relative mb-6">
        <span className="flex size-20 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
          {Icon ? (
            <Icon className="size-9 text-primary" />
          ) : (
            <Construction className="size-9 text-primary" />
          )}
        </span>
        <span className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full border border-border bg-warning/15 text-sm">
          🚧
        </span>
      </div>

      {/* Text */}
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>

      {/* Badge */}
      <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
        <span className="size-1.5 rounded-full bg-primary animate-pulse" />
        Coming soon
      </span>
    </div>
  );
}
