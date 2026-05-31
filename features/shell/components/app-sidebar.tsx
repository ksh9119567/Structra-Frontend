"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { StructraLogo, StructraMark } from "@/components/brand/structra-logo";
import { PRIMARY_NAV, SIDEBAR_WIDTH } from "@/config/navigation";

type AppSidebarProps = {
  open: boolean;
  onToggle: () => void;
};

export function AppSidebar({ open, onToggle }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      style={{ width: open ? SIDEBAR_WIDTH.expanded : SIDEBAR_WIDTH.collapsed }}
      className="relative flex h-full shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200 ease-in-out overflow-hidden"
    >
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
        {open ? (
          <StructraLogo size="sm" />
        ) : (
          <StructraMark className="size-6" />
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
        {PRIMARY_NAV.map((section, si) => (
          <div key={si} className={cn("mb-1", si > 0 && "mt-4")}>
            {section.heading && open && (
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                {section.heading}
              </p>
            )}
            {section.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  prefetch={false}
                  title={!open ? item.label : undefined}
                  className={cn(
                    "group relative flex h-9 items-center gap-3 rounded-md px-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {open && <span className="truncate">{item.label}</span>}
                  {item.badge && item.badge > 0 ? (
                    <span
                      className={cn(
                        "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold",
                        active
                          ? "bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground"
                          : "bg-primary/15 text-primary",
                        !open && "absolute right-1.5 top-1",
                      )}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="shrink-0 border-t border-border p-2">
        <button
          onClick={onToggle}
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-md text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <ChevronLeft
            className={cn(
              "size-4 transition-transform duration-200",
              !open && "rotate-180",
            )}
          />
          {open && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
