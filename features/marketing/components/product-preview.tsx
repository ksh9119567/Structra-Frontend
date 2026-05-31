import * as React from "react";

import { StructraLogo } from "@/components/brand/structra-logo";

const SUMMARY = [
  { label: "Projects", value: "24" },
  { label: "Tasks", value: "128" },
  { label: "Pending", value: "7" },
  { label: "Overdue", value: "15" },
];

const PROGRESS = [
  { label: "Website Redesign", value: 46 },
  { label: "Mobile App", value: 64 },
  { label: "API Integration", value: 71 },
  { label: "Internal Tooling", value: 32 },
];

/**
 * Decorative, non-interactive product mock for the hero. Purely presentational
 * so it renders on the server with no JS.
 */
export function ProductPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-primary/5">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
        <span className="size-2.5 rounded-full bg-muted-foreground/30" />
        <span className="size-2.5 rounded-full bg-muted-foreground/30" />
        <span className="size-2.5 rounded-full bg-muted-foreground/30" />
        <div className="ml-3 flex items-center gap-2">
          <StructraLogo size="sm" />
        </div>
        <div className="ml-auto h-6 w-32 rounded-md bg-muted/60" />
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="hidden w-36 shrink-0 flex-col gap-1 border-r border-border/70 p-3 sm:flex">
          {["Dashboard", "Projects", "Tasks", "Teams", "Activity", "Settings"].map(
            (item, i) => (
              <div
                key={item}
                className={
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs " +
                  (i === 0
                    ? "bg-primary/15 font-medium text-primary"
                    : "text-muted-foreground")
                }
              >
                <span
                  className={
                    "size-3 rounded-[3px] " +
                    (i === 0 ? "bg-primary" : "bg-muted-foreground/30")
                  }
                />
                {item}
              </div>
            ),
          )}
        </div>

        {/* Main */}
        <div className="flex-1 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-4 w-24 rounded bg-foreground/80" />
            <div className="h-6 w-20 rounded-md bg-primary/80" />
          </div>

          <div className="mb-4 grid grid-cols-4 gap-2">
            {SUMMARY.map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-border/70 bg-background/50 p-2.5"
              >
                <div className="text-base font-semibold text-foreground">
                  {s.value}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-border/70 bg-background/50 p-3">
            <div className="mb-3 h-3 w-28 rounded bg-muted-foreground/30" />
            <div className="flex flex-col gap-2.5">
              {PROGRESS.map((p) => (
                <div key={p.label} className="flex items-center gap-3">
                  <span className="w-24 truncate text-[10px] text-muted-foreground">
                    {p.label}
                  </span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${p.value}%` }}
                    />
                  </span>
                  <span className="w-8 text-right text-[10px] tabular-nums text-muted-foreground">
                    {p.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
