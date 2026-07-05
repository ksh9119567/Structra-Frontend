"use client";

import * as React from "react";
import {
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Mail,
  Shield,
  ArrowRight,
} from "lucide-react";

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
import { OrgRoleBadge } from "./org-role-badge";
import type { OrgRole } from "@/lib/organizations/types";

// ─── Constants ────────────────────────────────────────────────────────────────

// OWNER is excluded — you can't invite someone directly as owner
const INVITABLE_ROLES: { value: OrgRole; label: string; description: string }[] = [
  { value: "ADMIN",   label: "Admin",   description: "Full control except deleting the org" },
  { value: "MANAGER", label: "Manager", description: "Manage teams and projects" },
  { value: "MEMBER",  label: "Member",  description: "Standard access" },
  { value: "VIEWER",  label: "Viewer",  description: "Read-only access" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalPhase =
  | { phase: "idle" }
  | { phase: "sending" }
  | { phase: "success"; email: string; role: OrgRole }
  | { phase: "error"; message: string };

export type InviteMemberModalProps = {
  open: boolean;
  orgId: string;
  orgName: string;
  onClose: () => void;
  /** Called after a successful invite so the parent can refresh the members list. */
  onInvited?: (email: string, role: OrgRole) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function InviteMemberModal({
  open,
  orgId,
  orgName,
  onClose,
  onInvited,
}: InviteMemberModalProps) {
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<OrgRole>("MEMBER");
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [modalState, setModalState] = React.useState<ModalPhase>({ phase: "idle" });
  const emailRef = React.useRef<HTMLInputElement>(null);

  const isSending = modalState.phase === "sending";
  const isSuccess = modalState.phase === "success";

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setEmail("");
      setRole("MEMBER");
      setEmailError(null);
      setModalState({ phase: "idle" });
      const t = setTimeout(() => emailRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  // ── Validation ──────────────────────────────────────────────────────────────

  function validateEmail(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return "Email address is required.";
    if (!EMAIL_RE.test(trimmed)) return "Enter a valid email address.";
    return null;
  }

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
    if (emailError) setEmailError(validateEmail(e.target.value));
    if (modalState.phase === "error") setModalState({ phase: "idle" });
  }

  function handleEmailBlur() {
    setEmailError(validateEmail(email));
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      emailRef.current?.focus();
      return;
    }

    setModalState({ phase: "sending" });

    try {
      const res = await fetch(`/api/organizations/${orgId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), role }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.field === "email") {
          setEmailError(data.message);
          setModalState({ phase: "idle" });
          emailRef.current?.focus();
          return;
        }
        setModalState({ phase: "error", message: data.message ?? "Failed to send invite." });
        return;
      }

      const invitedEmail = email.trim().toLowerCase();
      setModalState({ phase: "success", email: invitedEmail, role });
      onInvited?.(invitedEmail, role);
    } catch {
      setModalState({ phase: "error", message: "Network error. Please check your connection." });
    }
  }

  // ── Close guard ─────────────────────────────────────────────────────────────

  function handleOpenChange(next: boolean) {
    if (isSending) return;
    if (!next) onClose();
  }

  // ── Invite another ──────────────────────────────────────────────────────────

  function handleInviteAnother() {
    setEmail("");
    setRole("MEMBER");
    setEmailError(null);
    setModalState({ phase: "idle" });
    setTimeout(() => emailRef.current?.focus(), 80);
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-md gap-0 p-0 overflow-hidden"
        showCloseButton={!isSending}
      >
        {isSuccess && modalState.phase === "success" ? (
          <SuccessView
            email={modalState.email}
            role={modalState.role}
            orgName={orgName}
            onClose={onClose}
            onInviteAnother={handleInviteAnother}
          />
        ) : (
          <FormView
            email={email}
            role={role}
            emailError={emailError}
            modalState={modalState}
            isSending={isSending}
            emailRef={emailRef}
            orgName={orgName}
            onEmailChange={handleEmailChange}
            onEmailBlur={handleEmailBlur}
            onRoleChange={setRole}
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
  email: string;
  role: OrgRole;
  emailError: string | null;
  modalState: ModalPhase;
  isSending: boolean;
  emailRef: React.RefObject<HTMLInputElement | null>;
  orgName: string;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEmailBlur: () => void;
  onRoleChange: (r: OrgRole) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
};

function FormView({
  email,
  role,
  emailError,
  modalState,
  isSending,
  emailRef,
  orgName,
  onEmailChange,
  onEmailBlur,
  onRoleChange,
  onSubmit,
  onClose,
}: FormViewProps) {
  const canSubmit = email.trim().length > 0 && !isSending;

  return (
    <>
      {/* Header */}
      <DialogHeader className="border-b border-border px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
            <UserPlus className="size-4 text-primary" />
          </span>
          <div>
            <DialogTitle className="text-sm font-semibold text-foreground">
              Invite Member
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
              Invite someone to join{" "}
              <span className="font-medium text-foreground">{orgName}</span>.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {/* Body */}
      <form id="invite-member-form" onSubmit={onSubmit} noValidate>
        <div className="space-y-5 px-6 py-5">

          {/* Form-level error */}
          {modalState.phase === "error" && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{modalState.message}</span>
            </div>
          )}

          {/* Email field */}
          <div className="space-y-1.5">
            <Label htmlFor="invite-email" className="text-sm font-medium text-foreground">
              Email address
              <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={emailRef}
                id="invite-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={onEmailChange}
                onBlur={onEmailBlur}
                placeholder="colleague@company.com"
                disabled={isSending}
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? "invite-email-error" : "invite-email-hint"}
                className={cn(
                  "h-10 pl-9 transition-colors",
                  emailError && "border-destructive focus-visible:ring-destructive/30",
                )}
              />
            </div>
            {/* Fixed-height hint/error area — prevents layout shift */}
            <div className="min-h-[1.125rem]">
              {emailError ? (
                <p
                  id="invite-email-error"
                  role="alert"
                  className="flex items-center gap-1 text-xs text-destructive"
                >
                  <AlertCircle className="size-3 shrink-0" />
                  {emailError}
                </p>
              ) : (
                <p id="invite-email-hint" className="text-xs text-muted-foreground">
                  The person must already have a Structra account.
                </p>
              )}
            </div>
          </div>

          {/* Role selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              <Shield className="mr-1.5 inline size-3.5 text-muted-foreground" />
              Role
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {INVITABLE_ROLES.map((r) => (
                <RoleOption
                  key={r.value}
                  value={r.value}
                  label={r.label}
                  description={r.description}
                  selected={role === r.value}
                  disabled={isSending}
                  onSelect={onRoleChange}
                />
              ))}
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
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="invite-member-form"
            size="default"
            disabled={!canSubmit}
            className="min-w-[120px] gap-1.5"
          >
            {isSending ? (
              <>
                <Spinner />
                Sending…
              </>
            ) : (
              <>
                <UserPlus className="size-4" />
                Send Invite
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

// ─── Role Option Card ─────────────────────────────────────────────────────────

function RoleOption({
  value,
  label,
  description,
  selected,
  disabled,
  onSelect,
}: {
  value: OrgRole;
  label: string;
  description: string;
  selected: boolean;
  disabled: boolean;
  onSelect: (r: OrgRole) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect(value)}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "flex flex-col items-start rounded-lg border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed",
        selected
          ? "border-primary bg-primary/8 ring-1 ring-primary/30"
          : "border-border bg-background hover:border-border/80 hover:bg-accent/40",
      )}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <OrgRoleBadge role={value} />
        {selected && (
          <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary">
            <CheckIcon />
          </span>
        )}
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
        {description}
      </p>
    </button>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" className="size-2.5 text-primary-foreground" fill="none">
      <path
        d="M2 6l3 3 5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Success View ─────────────────────────────────────────────────────────────

function SuccessView({
  email,
  role,
  orgName,
  onClose,
  onInviteAnother,
}: {
  email: string;
  role: OrgRole;
  orgName: string;
  onClose: () => void;
  onInviteAnother: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      {/* Icon */}
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-success/15">
        <CheckCircle2 className="size-7 text-success" />
      </span>

      <h3 className="text-base font-semibold text-foreground">Invite sent</h3>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
        An invite was sent to{" "}
        <span className="font-medium text-foreground">{email}</span> to join{" "}
        <span className="font-medium text-foreground">{orgName}</span>.
      </p>

      {/* Role confirmation */}
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5">
        <Shield className="size-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Invited as</span>
        <OrgRoleBadge role={role} />
      </div>

      {/* Actions */}
      <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        <Button
          variant="outline"
          size="default"
          onClick={onInviteAnother}
          className="gap-1.5"
        >
          <UserPlus className="size-4" />
          Invite another
        </Button>
        <Button size="default" onClick={onClose} className="gap-1.5">
          Done
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
