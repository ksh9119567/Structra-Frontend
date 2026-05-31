"use client";

import * as React from "react";
import { UserPlus, Mail, Shield } from "lucide-react";

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
import { TeamRoleBadge } from "./team-role-badge";
import { Spinner, RoleOptionCard, FormErrorBanner } from "@/features/shared/members/member-ui";
import type { TeamRole } from "@/lib/teams/types";

// ─── Constants ────────────────────────────────────────────────────────────────

// OWNER is excluded — cannot invite directly as owner
const INVITABLE_ROLES: { value: TeamRole; label: string; description: string }[] = [
  { value: "MANAGER", label: "Manager", description: "Manage team members and projects" },
  { value: "LEAD",    label: "Lead",    description: "Assign tasks and manage workflows" },
  { value: "MEMBER",  label: "Member",  description: "Standard team access" },
  { value: "VIEWER",  label: "Viewer",  description: "Read-only access" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalPhase =
  | { phase: "idle" }
  | { phase: "sending" }
  | { phase: "success"; email: string; role: TeamRole }
  | { phase: "error"; message: string };

export type InviteTeamMemberModalProps = {
  open: boolean;
  teamId: string;
  teamName: string;
  onClose: () => void;
  onInvited?: (email: string, role: TeamRole) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function InviteTeamMemberModal({
  open,
  teamId,
  teamName,
  onClose,
  onInvited,
}: InviteTeamMemberModalProps) {
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<TeamRole>("MEMBER");
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [modalState, setModalState] = React.useState<ModalPhase>({ phase: "idle" });
  const emailRef = React.useRef<HTMLInputElement>(null);

  const isSending = modalState.phase === "sending";
  const isSuccess = modalState.phase === "success";

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) { setEmailError(err); emailRef.current?.focus(); return; }

    setModalState({ phase: "sending" });
    try {
      const res = await fetch(`/api/teams/${teamId}/invite`, {
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

  function handleOpenChange(next: boolean) {
    if (isSending) return;
    if (!next) onClose();
  }

  function handleInviteAnother() {
    setEmail(""); setRole("MEMBER"); setEmailError(null);
    setModalState({ phase: "idle" });
    setTimeout(() => emailRef.current?.focus(), 80);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0 overflow-hidden" showCloseButton={!isSending}>
        {isSuccess && modalState.phase === "success" ? (
          <SuccessView
            email={modalState.email}
            role={modalState.role}
            teamName={teamName}
            onClose={onClose}
            onInviteAnother={handleInviteAnother}
          />
        ) : (
          <>
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
                    <span className="font-medium text-foreground">{teamName}</span>.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form id="invite-team-member-form" onSubmit={handleSubmit} noValidate>
              <div className="space-y-5 px-6 py-5">
                {modalState.phase === "error" && (
                  <FormErrorBanner message={modalState.message} />
                )}

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="invite-team-email" className="text-sm font-medium text-foreground">
                    Email address
                    <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      ref={emailRef}
                      id="invite-team-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={handleEmailChange}
                      onBlur={() => setEmailError(validateEmail(email))}
                      placeholder="colleague@company.com"
                      disabled={isSending}
                      aria-invalid={Boolean(emailError)}
                      className={cn(
                        "h-10 pl-9 transition-colors",
                        emailError && "border-destructive focus-visible:ring-destructive/30",
                      )}
                    />
                  </div>
                  <div className="min-h-[1.125rem]">
                    {emailError ? (
                      <p role="alert" className="flex items-center gap-1 text-xs text-destructive">
                        <span className="size-3 shrink-0">⚠</span>
                        {emailError}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        The person must already have a Structra account.
                      </p>
                    )}
                  </div>
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    <Shield className="mr-1.5 inline size-3.5 text-muted-foreground" />
                    Role
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {INVITABLE_ROLES.map((r) => (
                      <RoleOptionCard
                        key={r.value}
                        badge={<TeamRoleBadge role={r.value} />}
                        description={r.description}
                        selected={role === r.value}
                        disabled={isSending}
                        variant="compact"
                        onSelect={() => setRole(r.value)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="px-6 py-4">
                <Button type="button" variant="ghost" size="default" onClick={onClose} disabled={isSending}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="invite-team-member-form"
                  size="default"
                  disabled={!email.trim() || isSending}
                  className="min-w-[120px] gap-1.5"
                >
                  {isSending ? <><Spinner />Sending…</> : <><UserPlus className="size-4" />Send Invite</>}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Success View ─────────────────────────────────────────────────────────────

function SuccessView({
  email, role, teamName, onClose, onInviteAnother,
}: {
  email: string; role: TeamRole; teamName: string;
  onClose: () => void; onInviteAnother: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-success/15">
        <svg className="size-7 text-success" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 4 12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <h3 className="text-base font-semibold text-foreground">Invite sent</h3>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
        An invite was sent to{" "}
        <span className="font-medium text-foreground">{email}</span> to join{" "}
        <span className="font-medium text-foreground">{teamName}</span>.
      </p>
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5">
        <Shield className="size-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Invited as</span>
        <TeamRoleBadge role={role} />
      </div>
      <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        <Button variant="outline" size="default" onClick={onInviteAnother} className="gap-1.5">
          <UserPlus className="size-4" />
          Invite another
        </Button>
        <Button size="default" onClick={onClose} className="gap-1.5">
          Done
        </Button>
      </div>
    </div>
  );
}
