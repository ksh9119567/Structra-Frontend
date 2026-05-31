"use client";

import * as React from "react";
import {
  Building2,
  Users,
  FolderKanban,
  SquareCheckBig,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  Timer,
  ShieldCheck,
  Activity,
  ArrowRight,
  UserPlus,
  TrendingUp,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { AuthUser } from "@/lib/auth/types";

// ─── Mock data ────────────────────────────────────────────────────────────────

const SUMMARY_STATS = [
  { label: "Organizations", value: 3, icon: Building2, color: "text-primary", bg: "bg-primary/10" },
  { label: "Teams", value: 12, icon: Users, color: "text-info", bg: "bg-info/10" },
  { label: "Projects", value: 28, icon: FolderKanban, color: "text-warning", bg: "bg-warning/10" },
  { label: "Tasks", value: 147, icon: SquareCheckBig, color: "text-success", bg: "bg-success/10" },
];

const MY_TASKS = [
  { id: "t1", title: "Audit access policies", project: "Security Review", priority: "high", due: "Today", status: "in_progress" },
  { id: "t2", title: "Review Q3 budget proposal", project: "Finance", priority: "medium", due: "Today", status: "pending" },
  { id: "t3", title: "Update API documentation", project: "Platform", priority: "low", due: "Jun 2", status: "in_progress" },
  { id: "t4", title: "Onboard new team members", project: "HR", priority: "medium", due: "Jun 3", status: "pending" },
  { id: "t5", title: "Deploy v2.4 to staging", project: "Platform", priority: "high", due: "Overdue", status: "overdue" },
];

const PENDING_APPROVALS = [
  { id: "a1", title: "Q3 Budget Reallocation", requestedBy: "Mara Lin", type: "Governance", time: "2h ago" },
  { id: "a2", title: "New Team: DevOps", requestedBy: "Sam Torres", type: "Team", time: "5h ago" },
  { id: "a3", title: "Feature Flag: dark-mode-v2", requestedBy: "Devon Park", type: "Feature Flag", time: "1d ago" },
];

const ACTIVITY_FEED = [
  { id: "ac1", icon: FolderKanban, color: "text-warning", bg: "bg-warning/10", text: "Project \"Platform v3\" was created", sub: "by Jordan Rivera", time: "10m ago" },
  { id: "ac2", icon: Users, color: "text-info", bg: "bg-info/10", text: "Team \"DevOps\" was created", sub: "in Acme Corp", time: "1h ago" },
  { id: "ac3", icon: SquareCheckBig, color: "text-success", bg: "bg-success/10", text: "Task \"Deploy v2.3\" was completed", sub: "by Mara Lin", time: "3h ago" },
  { id: "ac4", icon: ShieldCheck, color: "text-primary", bg: "bg-primary/10", text: "Approval requested for \"Data Retention Policy\"", sub: "by Sam Torres", time: "5h ago" },
  { id: "ac5", icon: Building2, color: "text-muted-foreground", bg: "bg-muted", text: "Organization \"Globex\" was updated", sub: "plan changed to Team", time: "1d ago" },
];

const ORG_OVERVIEW = [
  { name: "Acme Corp", teams: 6, projects: 14, members: 42, plan: "Enterprise" },
  { name: "Globex", teams: 4, projects: 9, members: 18, plan: "Team" },
  { name: "Initech", teams: 2, projects: 5, members: 7, plan: "Free" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardView({ user }: { user: AuthUser }) {
  const firstName = user.first_name || user.username;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Welcome header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Good morning, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.email} · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <QuickCreateMenu />
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SUMMARY_STATS.map((stat) => (
          <SummaryCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left column — 2/3 width */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <MyWorkSection />
          <OrgOverviewSection />
        </div>

        {/* Right column — 1/3 width */}
        <div className="flex flex-col gap-4">
          <PendingApprovalsSection />
          <ActivityFeedSection />
        </div>
      </div>
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-card/80">
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", bg)}>
        <Icon className={cn("size-5", color)} />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ─── My Work ──────────────────────────────────────────────────────────────────

function MyWorkSection() {
  const dueToday = MY_TASKS.filter((t) => t.due === "Today").length;
  const overdue = MY_TASKS.filter((t) => t.status === "overdue").length;
  const completed = 8; // mock
  const pending = MY_TASKS.filter((t) => t.status === "pending").length;

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">My Work</h2>
          <p className="text-xs text-muted-foreground">Tasks assigned to you</p>
        </div>
        <button className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          View all <ArrowRight className="size-3" />
        </button>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
        <MiniStat icon={Clock} label="Due today" value={dueToday} color="text-warning" />
        <MiniStat icon={AlertCircle} label="Overdue" value={overdue} color="text-destructive" />
        <MiniStat icon={CheckCircle2} label="Completed" value={completed} color="text-success" />
        <MiniStat icon={Timer} label="Pending" value={pending} color="text-muted-foreground" />
      </div>

      {/* Task list */}
      <div className="divide-y divide-border/50">
        {MY_TASKS.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </div>
    </section>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 py-3">
      <Icon className={cn("size-4", color)} />
      <span className="text-lg font-bold tabular-nums text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-destructive/15 text-destructive",
  medium: "bg-warning/15 text-warning",
  low: "bg-muted text-muted-foreground",
};

const STATUS_STYLES: Record<string, string> = {
  in_progress: "bg-info/15 text-info",
  pending: "bg-muted text-muted-foreground",
  overdue: "bg-destructive/15 text-destructive",
};

const STATUS_LABELS: Record<string, string> = {
  in_progress: "In Progress",
  pending: "Pending",
  overdue: "Overdue",
};

function TaskRow({ task }: { task: (typeof MY_TASKS)[0] }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/50">
      <div
        className={cn(
          "size-2 shrink-0 rounded-full",
          task.status === "overdue"
            ? "bg-destructive"
            : task.status === "in_progress"
              ? "bg-info"
              : "bg-muted-foreground/40",
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
        <p className="text-xs text-muted-foreground">{task.project}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", PRIORITY_STYLES[task.priority])}>
          {task.priority}
        </span>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", STATUS_STYLES[task.status])}>
          {STATUS_LABELS[task.status]}
        </span>
        <span
          className={cn(
            "text-xs",
            task.due === "Overdue" ? "font-semibold text-destructive" : "text-muted-foreground",
          )}
        >
          {task.due}
        </span>
      </div>
    </div>
  );
}

// ─── Org Overview ─────────────────────────────────────────────────────────────

function OrgOverviewSection() {
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Organization Overview</h2>
          <p className="text-xs text-muted-foreground">Active teams, projects, and members</p>
        </div>
        <button className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          Manage <ArrowRight className="size-3" />
        </button>
      </div>
      <div className="divide-y divide-border/50">
        {ORG_OVERVIEW.map((org) => (
          <div key={org.name} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-accent/50">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-sm font-bold text-primary">
              {org.name[0]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{org.name}</p>
              <p className="text-xs text-muted-foreground">{org.plan} plan</p>
            </div>
            <div className="hidden items-center gap-5 sm:flex">
              <OrgStat icon={Users} value={org.teams} label="teams" />
              <OrgStat icon={FolderKanban} value={org.projects} label="projects" />
              <OrgStat icon={UserPlus} value={org.members} label="members" />
            </div>
            <TrendingUp className="size-4 text-success" />
          </div>
        ))}
      </div>
    </section>
  );
}

function OrgStat({ icon: Icon, value, label }: { icon: React.ElementType; value: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="size-3.5" />
      <span className="font-semibold text-foreground">{value}</span>
      <span>{label}</span>
    </div>
  );
}

// ─── Pending Approvals ────────────────────────────────────────────────────────

function PendingApprovalsSection() {
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Pending Approvals</h2>
          <p className="text-xs text-muted-foreground">{PENDING_APPROVALS.length} awaiting review</p>
        </div>
        <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {PENDING_APPROVALS.length}
        </span>
      </div>
      <div className="divide-y divide-border/50">
        {PENDING_APPROVALS.map((item) => (
          <div key={item.id} className="px-5 py-3.5 transition-colors hover:bg-accent/50">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.requestedBy} · {item.time}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning">
                {item.type}
              </span>
            </div>
            <div className="mt-2.5 flex gap-2">
              <button className="flex-1 rounded-md bg-success/15 py-1.5 text-xs font-semibold text-success transition-colors hover:bg-success/25">
                Approve
              </button>
              <button className="flex-1 rounded-md bg-destructive/10 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20">
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-5 py-3">
        <button className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          View all approvals <ArrowRight className="size-3" />
        </button>
      </div>
    </section>
  );
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

function ActivityFeedSection() {
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
          <p className="text-xs text-muted-foreground">Across your workspace</p>
        </div>
        <Activity className="size-4 text-muted-foreground" />
      </div>
      <div className="divide-y divide-border/50">
        {ACTIVITY_FEED.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="flex gap-3 px-5 py-3.5 transition-colors hover:bg-accent/50">
              <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg", item.bg)}>
                <Icon className={cn("size-3.5", item.color)} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground leading-snug">{item.text}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {item.sub} · {item.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-border px-5 py-3">
        <button className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          View full activity log <ArrowRight className="size-3" />
        </button>
      </div>
    </section>
  );
}

// ─── Quick Create ─────────────────────────────────────────────────────────────

function QuickCreateMenu() {
  const [open, setOpen] = React.useState(false);

  const actions = [
    { label: "Create Organization", icon: Building2 },
    { label: "Create Team", icon: Users },
    { label: "Create Project", icon: FolderKanban },
    { label: "Create Task", icon: SquareCheckBig },
    { label: "Invite Member", icon: UserPlus },
  ];

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-quick-create]")) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" data-quick-create>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Plus className="size-4" />
        Quick Create
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-lg border border-border bg-popover p-1 shadow-lg">
          {actions.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
            >
              <Icon className="size-4 text-muted-foreground" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
