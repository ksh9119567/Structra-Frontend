"use client";

import * as React from "react";
import { Building2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { OrganizationSummary } from "@/lib/organizations/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalState =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "success"; org: OrganizationSummary }
  | { phase: "error"; message: string };

type CreateOrganizationModalProps = {
  open: boolean;
  onClose: () => void;
  /** Called after a successful creation. The parent can optimistically update its list. */
  onCreated: (org: OrganizationSummary) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateOrganizationModal({
  open,
  onClose,
  onCreated,
}: CreateOrganizationModalProps) {
  const [name, setName] = React.useState("");
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [state, setState] = React.useState<ModalState>({ phase: "idle" });
  const inputRef = React.useRef<HTMLInputElement>(null);

  const isSubmitting = state.phase === "submitting";
  const isSuccess = state.phase === "success";

  // Reset form whenever the dialog opens
  React.useEffect(() => {
    if (open) {
      setName("");
      setNameError(null);
      setState({ phase: "idle" });
      // Delay focus so Radix animation completes first
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  // ── Validation ──────────────────────────────────────────────────────────────

  function validate(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return "Organization name is required.";
    if (trimmed.length > 255) return "Name must be 255 characters or fewer.";
    return null;
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value);
    // Clear field error as user types (re-validate only if already touched)
    if (nameError) {
      const err = validate(e.target.value);
      setNameError(err);
    }
    // Clear form-level error when user starts editing
    if (state.phase === "error") setState({ phase: "idle" });
  }

  function handleNameBlur() {
    setNameError(validate(name));
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Run full validation on submit
    const err = validate(name);
    if (err) {
      setNameError(err);
      inputRef.current?.focus();
      return;
    }

    setState({ phase: "submitting" });

    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Field-level error from backend (e.g. duplicate name)
        if (data.field === "name") {
          setNameError(data.message);
          setState({ phase: "idle" });
          inputRef.current?.focus();
          return;
        }
        setState({ phase: "error", message: data.message ?? "Failed to create organization." });
        return;
      }

      const org = data as OrganizationSummary;
      setState({ phase: "success", org });
      // Notify parent after a brief moment so user sees the success state
      setTimeout(() => {
        onCreated(org);
      }, 900);
    } catch {
      setState({ phase: "error", message: "Network error. Please check your connection." });
    }
  }

  // ── Close guard ─────────────────────────────────────────────────────────────

  function handleOpenChange(nextOpen: boolean) {
    // Prevent closing while submitting
    if (isSubmitting) return;
    if (!nextOpen) onClose();
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-md gap-0 p-0 overflow-hidden"
        showCloseButton={!isSubmitting}
      >
        {isSuccess && state.phase === "success" ? (
          <SuccessView org={state.org} onClose={onClose} />
        ) : (
          <FormView
            name={name}
            nameError={nameError}
            state={state}
            isSubmitting={isSubmitting}
            inputRef={inputRef}
            onNameChange={handleNameChange}
            onNameBlur={handleNameBlur}
            onSubmit={handleSubmit}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Form View ────────────────────────────────────────────────────────────────

type FormViewProps = {
  name: string;
  nameError: string | null;
  state: ModalState;
  isSubmitting: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNameBlur: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
};

function FormView({
  name,
  nameError,
  state,
  isSubmitting,
  inputRef,
  onNameChange,
  onNameBlur,
  onSubmit,
  onClose,
}: FormViewProps) {
  const canSubmit = name.trim().length > 0 && !isSubmitting;

  return (
    <>
      {/* Header */}
      <DialogHeader className="border-b border-border px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
            <Building2 className="size-4 text-primary" />
          </span>
          <div>
            <DialogTitle className="text-sm font-semibold text-foreground">
              Create Organization
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
              You'll be set as the owner automatically.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {/* Body */}
      <form id="create-org-form" onSubmit={onSubmit} noValidate>
        <div className="px-6 py-5 space-y-4">
          {/* Form-level error banner */}
          {state.phase === "error" && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{state.message}</span>
            </div>
          )}

          {/* Name field */}
          <div className="space-y-1.5">
            <Label htmlFor="org-name" className="text-sm font-medium text-foreground">
              Organization name
              <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>
            </Label>

            <Input
              ref={inputRef}
              id="org-name"
              type="text"
              value={name}
              onChange={onNameChange}
              onBlur={onNameBlur}
              placeholder="e.g. Acme Corp"
              maxLength={255}
              autoComplete="off"
              disabled={isSubmitting}
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? "org-name-error" : "org-name-hint"}
              className={cn(
                "h-10 transition-colors",
                nameError && "border-destructive focus-visible:ring-destructive/30",
              )}
            />

            {/* Hint / error — always occupies space to prevent layout shift */}
            <div className="min-h-[1.125rem]">
              {nameError ? (
                <p
                  id="org-name-error"
                  role="alert"
                  className="flex items-center gap-1 text-xs text-destructive"
                >
                  <AlertCircle className="size-3 shrink-0" />
                  {nameError}
                </p>
              ) : (
                <p id="org-name-hint" className="text-xs text-muted-foreground">
                  Must be unique across Structra. You can rename it later.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            size="default"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-org-form"
            size="default"
            disabled={!canSubmit}
            className="min-w-[130px] gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Spinner />
                Creating…
              </>
            ) : (
              <>
                <Building2 className="size-4" />
                Create Organization
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

// ─── Success View ─────────────────────────────────────────────────────────────

function SuccessView({
  org,
  onClose,
}: {
  org: OrganizationSummary;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      {/* Animated checkmark */}
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-success/15">
        <CheckCircle2 className="size-7 text-success" />
      </span>

      <h3 className="text-base font-semibold text-foreground">
        Organization created
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{org.name}</span> is ready.
        You're the owner.
      </p>

      <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        <Button
          variant="ghost"
          size="default"
          onClick={onClose}
          className="sm:order-1"
        >
          Close
        </Button>
        <Button
          size="default"
          onClick={onClose}
          className="gap-1.5 sm:order-2"
          asChild
        >
          <a href={`/organizations/${org.id}`}>
            Open Organization
            <ArrowRight className="size-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
