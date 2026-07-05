"use client";

import * as React from "react";
import { ListTodo } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Spinner, FormErrorBanner } from "@/features/shared/members/member-ui";
import type { ProjectSummary } from "@/lib/projects/types";
import type { TaskSummary } from "@/lib/tasks/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalPhase =
  | { phase: "idle" }
  | { phase: "saving" }
  | { phase: "error"; message: string };

export type CreateTaskModalProps = {
  open: boolean;
  /** When provided, the task is created directly in this project (Project Tasks Tab). */
  projectId?: string;
  onClose: () => void;
  onCreated?: (task: TaskSummary) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateTaskModal({ open, projectId, onClose, onCreated }: CreateTaskModalProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selectedProjectId, setSelectedProjectId] = React.useState("");
  const [projects, setProjects] = React.useState<ProjectSummary[]>([]);
  const [projectsLoading, setProjectsLoading] = React.useState(false);
  const [modalState, setModalState] = React.useState<ModalPhase>({ phase: "idle" });
  const inputRef = React.useRef<HTMLInputElement>(null);

  const isSaving = modalState.phase === "saving";

  React.useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setSelectedProjectId("");
      setModalState({ phase: "idle" });
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Load the user's projects for the project selector — only when no
  // projectId was supplied (i.e. opened from the global Tasks page).
  React.useEffect(() => {
    if (!open || projectId) return;
    let cancelled = false;
    setProjectsLoading(true);
    fetch("/api/projects?page_size=100")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          const list: ProjectSummary[] = data.results?.data ?? [];
          setProjects([...list].sort((a, b) => a.name.localeCompare(b.name)));
          setProjectsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setProjectsLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, projectId]);

  const canSubmit =
    title.trim().length > 0 && !isSaving && (!!projectId || selectedProjectId !== "");

  async function handleSubmit() {
    if (!canSubmit) return;
    setModalState({ phase: "saving" });

    const endpoint = projectId ? `/api/projects/${projectId}/tasks` : "/api/tasks";
    const body: Record<string, string> = {
      title: title.trim(),
      description: description.trim(),
    };
    if (!projectId) body.project_id = selectedProjectId;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setModalState({ phase: "error", message: data.message ?? "Failed to create task." });
        return;
      }

      onCreated?.(data.data as TaskSummary);
    } catch {
      setModalState({ phase: "error", message: "Network error. Please check your connection." });
    }
  }

  function handleOpenChange(next: boolean) {
    if (isSaving) return;
    if (!next) onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0 overflow-hidden" showCloseButton={!isSaving}>
        {/* Header */}
        <div className="border-b border-border bg-muted/30 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
              <ListTodo className="size-4 text-primary" />
            </span>
            <div>
              <DialogTitle className="text-sm font-semibold text-foreground">
                Create Task
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                {projectId ? "Add a new task to this project." : "Add a new task to one of your projects."}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          {modalState.phase === "error" && <FormErrorBanner message={modalState.message} />}

          {!projectId && (
            <div className="space-y-1.5">
              <Label htmlFor="task-project" className="text-sm font-medium text-foreground">
                Project
                <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>
              </Label>
              <select
                id="task-project"
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  if (modalState.phase === "error") setModalState({ phase: "idle" });
                }}
                disabled={isSaving || projectsLoading}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 transition-colors appearance-none"
              >
                <option value="" disabled>
                  {projectsLoading ? "Loading projects…" : "Select a project…"}
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {!projectsLoading && projects.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  You don&apos;t have any projects yet. Create one first.
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="task-title" className="text-sm font-medium text-foreground">
              Title
            </Label>
            <Input
              ref={inputRef}
              id="task-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (modalState.phase === "error") setModalState({ phase: "idle" });
              }}
              placeholder="e.g. Set up CI pipeline"
              disabled={isSaving}
              maxLength={255}
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-description" className="text-sm font-medium text-foreground">
              Description <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more context for this task…"
              disabled={isSaving}
              rows={4}
              className={cn(
                "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-xs transition-[color,box-shadow] outline-none resize-none",
                "placeholder:text-muted-foreground",
                "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
                "dark:bg-input/30",
              )}
            />
          </div>
        </div>

        <DialogFooter className="px-6 py-4">
          <Button type="button" variant="ghost" size="default" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button size="default" disabled={!canSubmit} onClick={handleSubmit} className="min-w-[120px] gap-1.5">
            {isSaving ? (
              <><Spinner />Creating…</>
            ) : (
              "Create Task"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
