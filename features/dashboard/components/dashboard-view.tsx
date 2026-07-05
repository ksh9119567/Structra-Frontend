"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  FolderKanban,
  SquareCheckBig,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Timer,
  ArrowRight,
  UserPlus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { StatCard, StatCardSkeleton } from "@/features/shared/stat-card";
import { FormErrorBanner } from "@/features/shared/members/member-ui";
import { ActivitySection, type ActivityState } from "@/features/shared/activity/activity-ui";
import { TaskStatusBadge } from "@/features/tasks/components/task-status-badge";
import { TaskPriorityBadge } from "@/features/tasks/components/task-priority-badge";
import { TaskDetailDrawer } from "@/features/tasks/components/task-detail-drawer";
import { CreateTaskModal } from "@/features/tasks/components/create-task-modal";
import { CreateOrganizationModal } from "@/features/organizations/components/create-organization-modal";
import { CreateTeamModal } from "@/features/teams/components/create-team-modal";
import { CreateProjectModal } from "@/features/projects/components/create-project-modal";
import { InviteMemberModal } from "@/features/organizations/components/invite-member-modal";
import { TASK_STATUS_META, type TaskSummary } from "@/lib/tasks/types";
import type { ActivityLogEntry, OrganizationSummary } from "@/lib/organizations/types";
import type { AuthUser } from "@/lib/auth/types";

// ─── Mock data ────────────────────────────────────────────────────────────────

const PENDING_APPROVALS = [
  { id: "a1", title: "Q3 Budget Reallocation", requestedBy: "Mara Lin", type: "Governance", time: "2h ago" },
  { id: "a2", title: "New Team: DevOps", requestedBy: "Sam Torres", type: "Team", time: "5h ago" },
  { id: "a3", title: "Feature Flag: dark-mode-v2", requestedBy: "Devon Park", type: "Feature Flag", time: "1d ago" },
];

// ─── Summary stats ──────────────────────────────────────────────────────────

type SummaryStats = {
  organizations: number;
  teams: number;
  projects: number;
  tasks: number;
};

type SummaryStatsState =
  | { status: "loading" }
  | { status: "success"; stats: SummaryStats }
  | { status: "error"; message: string };

const SUMMARY_CARD_META = [
  { key: "organizations", label: "Organizations", icon: Building2, color: "text-primary", bg: "bg-primary/10" },
  { key: "teams", label: "Teams", icon: Users, color: "text-info", bg: "bg-info/10" },
  { key: "projects", label: "Projects", icon: FolderKanban, color: "text-warning", bg: "bg-warning/10" },
  { key: "tasks", label: "My Tasks", icon: SquareCheckBig, color: "text-success", bg: "bg-success/10" },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardView({ user }: { user: AuthUser }) {
  const firstName = user.first_name || user.username;

  const [statsState, setStatsState] = React.useState<SummaryStatsState>({ status: "loading" });
  const [orgRefreshKey, setOrgRefreshKey] = React.useState(0);
  const [taskRefreshKey, setTaskRefreshKey] = React.useState(0);

  const fetchStats = React.useCallback(async () => {
    setStatsState({ status: "loading" });
    try {
      const [orgsRes, teamsRes, projectsRes, tasksRes] = await Promise.all([
        fetch("/api/organizations"),
        fetch("/api/teams"),
        fetch("/api/projects"),
        fetch("/api/tasks"),
      ]);

      if (!orgsRes.ok || !teamsRes.ok || !projectsRes.ok || !tasksRes.ok) {
        setStatsState({ status: "error", message: "Failed to load summary stats." });
        return;
      }

      const [orgs, teams, projects, tasks] = await Promise.all([
        orgsRes.json(),
        teamsRes.json(),
        projectsRes.json(),
        tasksRes.json(),
      ]);

      setStatsState({
        status: "success",
        stats: {
          organizations: orgs.count ?? 0,
          teams: teams.count ?? 0,
          projects: projects.count ?? 0,
          tasks: tasks.count ?? 0,
        },
      });
    } catch {
      setStatsState({ status: "error", message: "Network error. Please try again." });
    }
  }, []);

  React.useEffect(() => { fetchStats(); }, [fetchStats]);

  function handleOrgCreated() {
    fetchStats();
    setOrgRefreshKey((k) => k + 1);
  }

  function handleTaskCreated() {
    fetchStats();
    setTaskRefreshKey((k) => k + 1);
  }

  function handleTeamCreated() {
    fetchStats();
    setOrgRefreshKey((k) => k + 1);
  }

  function handleProjectCreated() {
    fetchStats();
    setOrgRefreshKey((k) => k + 1);
  }

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
        <QuickCreateMenu
          onOrgCreated={handleOrgCreated}
          onTaskCreated={handleTaskCreated}
          onTeamCreated={handleTeamCreated}
          onProjectCreated={handleProjectCreated}
        />
      </div>

      {/* Summary cards */}
      {statsState.status === "error" ? (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">{statsState.message}</p>
          <button
            onClick={fetchStats}
            className="text-xs font-medium text-primary hover:underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statsState.status === "loading"
            ? SUMMARY_CARD_META.map((meta) => <StatCardSkeleton key={meta.key} />)
            : SUMMARY_CARD_META.map((meta) => (
                <StatCard
                  key={meta.key}
                  label={meta.label}
                  value={statsState.stats[meta.key]}
                  icon={meta.icon}
                  color={meta.color}
                  bg={meta.bg}
                />
              ))}
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left column — 2/3 width */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <MyWorkSection refreshKey={taskRefreshKey} />
          <OrgOverviewSection refreshKey={orgRefreshKey} />
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

// ─── My Work ──────────────────────────────────────────────────────────────────

type MyTasksState =
  | { status: "loading" }
  | { status: "success"; tasks: TaskSummary[] }
  | { status: "error"; message: string };

function MyWorkSection({ refreshKey }: { refreshKey: number }) {
  const [tasksState, setTasksState] = React.useState<MyTasksState>({ status: "loading" });
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);

  const fetchMyTasks = React.useCallback(async () => {
    setTasksState({ status: "loading" });
    try {
      const res = await fetch("/api/tasks?ordering=due_date&page_size=5");
      const data = await res.json();

      if (!res.ok) {
        setTasksState({ status: "error", message: data.message ?? "Failed to load tasks." });
        return;
      }

      setTasksState({ status: "success", tasks: data.results?.data ?? [] });
    } catch {
      setTasksState({ status: "error", message: "Network error. Please try again." });
    }
  }, []);

  React.useEffect(() => { fetchMyTasks(); }, [fetchMyTasks, refreshKey]);

  const tasks = tasksState.status === "success" ? tasksState.tasks : [];
  const isLoading = tasksState.status === "loading";

  const today = new Date(new Date().toDateString());
  const dueToday = isLoading ? null : tasks.filter((t) => t.due_date && new Date(t.due_date).toDateString() === today.toDateString()).length;
  const overdue = isLoading ? null : tasks.filter((t) => t.due_date && t.status !== "DONE" && new Date(t.due_date) < today).length;
  const inProgress = isLoading ? null : tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const completed = isLoading ? null : tasks.filter((t) => t.status === "DONE").length;

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">My Work</h2>
          <p className="text-xs text-muted-foreground">Tasks assigned to you</p>
        </div>
        <Link href="/tasks" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          View all <ArrowRight className="size-3" />
        </Link>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
        <MiniStat icon={Clock} label="Due today" value={dueToday} color="text-warning" />
        <MiniStat icon={AlertCircle} label="Overdue" value={overdue} color="text-destructive" />
        <MiniStat icon={Timer} label="In progress" value={inProgress} color="text-info" />
        <MiniStat icon={CheckCircle2} label="Completed" value={completed} color="text-success" />
      </div>

      {/* Task list */}
      {tasksState.status === "loading" && <TaskRowSkeleton />}

      {tasksState.status === "error" && (
        <div className="px-5 py-4">
          <FormErrorBanner message={tasksState.message} />
          <button
            onClick={fetchMyTasks}
            className="mt-2 text-xs font-medium text-primary hover:underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}

      {tasksState.status === "success" && tasks.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
          <CheckCircle2 className="size-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">No tasks assigned to you.</p>
        </div>
      )}

      {tasksState.status === "success" && tasks.length > 0 && (
        <div className="divide-y divide-border/50">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} onSelect={() => setSelectedTaskId(task.id)} />
          ))}
        </div>
      )}

      <TaskDetailDrawer
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdated={fetchMyTasks}
        onDeleted={fetchMyTasks}
      />
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
  value: number | null;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 py-3">
      <Icon className={cn("size-4", color)} />
      {value === null ? (
        <span className="h-[1.125rem] w-6 animate-pulse rounded bg-muted" />
      ) : (
        <span className="text-lg font-bold tabular-nums text-foreground">{value}</span>
      )}
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function TaskRow({ task, onSelect }: { task: TaskSummary; onSelect: () => void }) {
  const dueDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "—";

  const isOverdue =
    !!task.due_date &&
    task.status !== "DONE" &&
    new Date(task.due_date) < new Date(new Date().toDateString());

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-accent/50"
    >
      <span className={cn("size-2 shrink-0 rounded-full", TASK_STATUS_META[task.status].dotClass)} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
        <p className="truncate text-xs text-muted-foreground">{task.project_name}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <TaskPriorityBadge priority={task.priority} />
        <TaskStatusBadge status={task.status} />
        <span
          className={cn(
            "hidden text-xs tabular-nums sm:inline",
            isOverdue ? "font-semibold text-destructive" : "text-muted-foreground",
          )}
        >
          {dueDate}
        </span>
      </div>
    </button>
  );
}

function TaskRowSkeleton() {
  return (
    <div className="divide-y divide-border/50">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
          <div className="size-2 shrink-0 rounded-full bg-muted" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3 w-1/2 rounded bg-muted" />
            <div className="h-2.5 w-1/3 rounded bg-muted" />
          </div>
          <div className="hidden h-3 w-32 rounded bg-muted sm:block" />
        </div>
      ))}
    </div>
  );
}

// ─── Org Overview ─────────────────────────────────────────────────────────────

type OrgOverviewState =
  | { status: "loading" }
  | { status: "success"; orgs: OrganizationSummary[] }
  | { status: "error"; message: string };

function OrgOverviewSection({ refreshKey }: { refreshKey: number }) {
  const [orgState, setOrgState] = React.useState<OrgOverviewState>({ status: "loading" });

  const fetchOrgs = React.useCallback(async () => {
    setOrgState({ status: "loading" });
    try {
      const res = await fetch("/api/organizations");
      const data = await res.json();

      if (!res.ok) {
        setOrgState({ status: "error", message: data.message ?? "Failed to load organizations." });
        return;
      }

      setOrgState({ status: "success", orgs: data.results?.data ?? [] });
    } catch {
      setOrgState({ status: "error", message: "Network error. Please try again." });
    }
  }, []);

  React.useEffect(() => { fetchOrgs(); }, [fetchOrgs, refreshKey]);

  const orgs = orgState.status === "success" ? orgState.orgs.slice(0, 5) : [];

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Organization Overview</h2>
          <p className="text-xs text-muted-foreground">Active teams, projects, and members</p>
        </div>
        <Link href="/organizations" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          Manage <ArrowRight className="size-3" />
        </Link>
      </div>

      {orgState.status === "loading" && <OrgOverviewSkeleton />}

      {orgState.status === "error" && (
        <div className="px-5 py-4">
          <FormErrorBanner message={orgState.message} />
          <button
            onClick={fetchOrgs}
            className="mt-2 text-xs font-medium text-primary hover:underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}

      {orgState.status === "success" && orgs.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
          <Building2 className="size-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            You&apos;re not part of any organizations yet.
          </p>
        </div>
      )}

      {orgState.status === "success" && orgs.length > 0 && (
        <div className="divide-y divide-border/50">
          {orgs.map((org) => (
            <Link
              key={org.id}
              href={`/organizations/${org.id}`}
              prefetch={false}
              className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-accent/50"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-sm font-bold text-primary">
                {org.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                  {org.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">{org.owner_email}</p>
              </div>
              <div className="hidden items-center gap-5 sm:flex">
                <OrgStat icon={Users} value={org.member_count} label="members" />
                <OrgStat icon={Users} value={org.team_count} label="teams" iconClass="text-info" />
                <OrgStat icon={FolderKanban} value={org.project_count} label="projects" iconClass="text-warning" />
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function OrgStat({
  icon: Icon,
  value,
  label,
  iconClass,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  iconClass?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className={cn("size-3.5", iconClass ?? "text-muted-foreground")} />
      <span className="font-semibold text-foreground">{value}</span>
      <span>{label}</span>
    </div>
  );
}

function OrgOverviewSkeleton() {
  return (
    <div className="divide-y divide-border/50">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
          <div className="size-8 shrink-0 rounded-lg bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-1/3 rounded bg-muted" />
            <div className="h-2.5 w-1/4 rounded bg-muted" />
          </div>
          <div className="hidden h-3 w-32 rounded bg-muted sm:block" />
        </div>
      ))}
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
        <Link
          href="/approvals"
          prefetch={false}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View all approvals <ArrowRight className="size-3" />
        </Link>
      </div>
    </section>
  );
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

type DashboardActivityState =
  | { status: "loading" }
  | { status: "success"; entries: ActivityLogEntry[] }
  | { status: "error"; message: string };

function ActivityFeedSection() {
  const [activityState, setActivityState] = React.useState<DashboardActivityState>({
    status: "loading",
  });

  const fetchActivity = React.useCallback(async () => {
    setActivityState({ status: "loading" });
    try {
      const res = await fetch("/api/activity?ordering=-timestamp&page_size=8");
      if (!res.ok) {
        setActivityState({ status: "error", message: "Failed to load activity." });
        return;
      }
      const data = await res.json();
      const entries: ActivityLogEntry[] = data.results ?? data.data ?? [];
      setActivityState({ status: "success", entries: entries.slice(0, 8) });
    } catch {
      setActivityState({ status: "error", message: "Network error. Please try again." });
    }
  }, []);

  React.useEffect(() => { fetchActivity(); }, [fetchActivity]);

  const sectionState: ActivityState =
    activityState.status === "error" ? { status: "error" } : activityState;

  return (
    <ActivitySection
      state={sectionState}
      subtitle="Across your workspace"
      errorMessage={
        activityState.status === "error"
          ? activityState.message
          : "Failed to load activity."
      }
      onRetry={fetchActivity}
    />
  );
}

// ─── Quick Create ─────────────────────────────────────────────────────────────

function QuickCreateMenu({
  onOrgCreated,
  onTaskCreated,
  onTeamCreated,
  onProjectCreated,
}: {
  onOrgCreated: (org: OrganizationSummary) => void;
  onTaskCreated: () => void;
  onTeamCreated: () => void;
  onProjectCreated: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [createOrgOpen, setCreateOrgOpen] = React.useState(false);
  const [createTaskOpen, setCreateTaskOpen] = React.useState(false);
  const [createTeamOpen, setCreateTeamOpen] = React.useState(false);
  const [createProjectOpen, setCreateProjectOpen] = React.useState(false);

  const [orgPickerOpen, setOrgPickerOpen] = React.useState(false);
  const [orgsLoading, setOrgsLoading] = React.useState(false);
  const [pickerOrgs, setPickerOrgs] = React.useState<OrganizationSummary[]>([]);
  const [inviteOrg, setInviteOrg] = React.useState<OrganizationSummary | null>(null);
  const [inviteOpen, setInviteOpen] = React.useState(false);

  async function handleInviteMember() {
    setOrgsLoading(true);
    try {
      const res = await fetch("/api/organizations");
      const data = await res.json();
      const orgs: OrganizationSummary[] = data.results?.data ?? [];
      if (orgs.length === 1) {
        setInviteOrg(orgs[0]);
        setInviteOpen(true);
      } else if (orgs.length > 1) {
        setPickerOrgs(orgs);
        setOrgPickerOpen(true);
      }
    } finally {
      setOrgsLoading(false);
    }
  }

  const actions = [
    { label: "Create Organization", icon: Building2, onSelect: () => setCreateOrgOpen(true), disabled: false },
    { label: "Create Team", icon: Users, onSelect: () => setCreateTeamOpen(true), disabled: false },
    { label: "Create Project", icon: FolderKanban, onSelect: () => setCreateProjectOpen(true), disabled: false },
    { label: "Create Task", icon: SquareCheckBig, onSelect: () => setCreateTaskOpen(true), disabled: false },
    { label: "Invite Member", icon: UserPlus, onSelect: handleInviteMember, disabled: orgsLoading },
  ];

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-quick-create]")) {
        setOpen(false);
        setOrgPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" data-quick-create>
      <button
        onClick={() => {
          setOpen((v) => !v);
          setOrgPickerOpen(false);
        }}
        className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Plus className="size-4" />
        Quick Create
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-lg border border-border bg-popover p-1 shadow-lg">
          {actions.map(({ label, icon: Icon, onSelect, disabled }) => (
            <button
              key={label}
              disabled={disabled}
              onClick={() => {
                setOpen(false);
                onSelect?.();
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent",
                disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
              )}
            >
              <Icon className="size-4 text-muted-foreground" />
              <span className="flex-1 text-left">{label}</span>
            </button>
          ))}
        </div>
      )}

      {orgPickerOpen && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-lg border border-border bg-popover p-1 shadow-lg">
          <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Invite to which org?
          </p>
          {pickerOrgs.map((org) => (
            <button
              key={org.id}
              onClick={() => {
                setOrgPickerOpen(false);
                setInviteOrg(org);
                setInviteOpen(true);
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
            >
              <Building2 className="size-4 text-muted-foreground" />
              <span className="flex-1 truncate text-left">{org.name}</span>
            </button>
          ))}
        </div>
      )}

      <CreateOrganizationModal
        open={createOrgOpen}
        onClose={() => setCreateOrgOpen(false)}
        onCreated={(org) => {
          setCreateOrgOpen(false);
          onOrgCreated(org);
        }}
      />

      <CreateTaskModal
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        onCreated={() => {
          setCreateTaskOpen(false);
          onTaskCreated();
        }}
      />

      <CreateTeamModal
        open={createTeamOpen}
        onClose={() => setCreateTeamOpen(false)}
        onCreated={() => {
          setCreateTeamOpen(false);
          onTeamCreated();
        }}
      />

      <CreateProjectModal
        open={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        onCreated={() => {
          setCreateProjectOpen(false);
          onProjectCreated();
        }}
      />

      {inviteOrg && (
        <InviteMemberModal
          open={inviteOpen}
          orgId={inviteOrg.id}
          orgName={inviteOrg.name}
          onClose={() => setInviteOpen(false)}
        />
      )}
    </div>
  );
}
