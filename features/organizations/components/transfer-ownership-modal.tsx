"use client";

import * as React from "react";
import {
  Crown,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
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
import type { OrgMembership } from "@/lib/organizations/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalPhase =
  | { phase: "idle" }
  | { phase: "transferring" }
  | { phase: "success"; newOwnerEmail: string }
  | { phase: "error"; message: string };

export type TransferOwnershipModalProps = {
  open: boolean;
  orgId: string;
  orgName: string;
  /** The member being promoted to owner */
  member: OrgMembership | null;
  /** The current owner's email */
  currentOwnerEmail: string;
  onClose: () => void;
  /** Called after a successful transfer — parent should refresh and redirect */
  onTransferred?: (newOwnerEmail: string) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function TransferOwnershipModal({
  open,
  orgId,
  orgName,
  member,
  currentOwnerEmail,
  onClose,
  onTransferred,
}: TransferOwnershipModalProps) {
  const [confirmText, setConfirmText] = React.useState("");
  const [modalState, setModalState] = React.useState<ModalPhase>({ phase: "idle" });
  const inputRef = React.useRef<HTMLInputElement>(null);

  const isTransferring = modalState.phase === "transferring";
  const isSuccess = modalState.phase === "success";

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setConfirmText("");
      setModalState({ phase: "idle" });
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!member) return null;

  // Transfer button only enabled when user has typed the exact org name
  const confirmationMatches = confirmText.trim() === orgName.trim();
  const canTransfer = confirmationMatches && !isTransferring;

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleTransfer() {
    if (!canTransfer) return;
    setModalState({ phase: "transferring" });

    try {
      const res = await fetch(`/api/organizations/${orgId}/transfer-owner`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: member.user_email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setModalState({ phase: "error", message: data.message ?? "Failed to transfer ownership." });
        return;
      }

      setModalState({ phase: "success", newOwnerEmail: member.user_email });
      onTransferred?.(member.user_email);
    } catch {
      setModalState({ phase: "error", message: "Network error. Please check your connection." });
    }
  }

  function handleOpenChange(next: boolean) {
    if (isTransferring) return;
    if (!next) onClose();
  }

  const newOwnerInitials = member.user_email.split("@")[0].slice(0, 2).toUpperCase();
  const currentOwnerInitials = currentOwnerEmail.split("@")[0].slice(0, 2).toUpperCase();

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-md gap-0 p-0 overflow-hidden"
        showCloseButton={!isTransferring}
      >
        {isSuccess && modalState.phase === "success" ? (
          <SuccessView
            newOwnerEmail={modalState.newOwnerEmail}
            orgName={orgName}
            onClose={onClose}
          />
        ) : (
          <>
            {/* ── Header — destructive emphasis ── */}
            <div className="border-b border-destructive/20 bg-destructive/5 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/15">
                  <ShieldAlert className="size-4 text-destructive" />
                </span>
                <div>
                  <DialogTitle className="text-sm font-semibold text-foreground">
                    Transfer Ownership
                  </DialogTitle>
                  <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                    This action is immediate and cannot be undone.
                  </DialogDescription>
                </div>
              </div>
            </div>

            <div className="space-y-5 px-6 py-5">
              {/* Error banner */}
              {modalState.phase === "error" && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{modalState.message}</span>
                </div>
              )}

              {/* Ownership transfer diagram */}
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Ownership transfer
                </p>
                <div className="flex items-center gap-3">
                  {/* Current owner */}
                  <div className="flex flex-1 flex-col items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-3 text-center">
                    <span className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      {currentOwnerInitials}
                    </span>
                    <p className="max-w-[100px] truncate text-[11px] font-medium text-foreground">
                      {currentOwnerEmail}
                    </p>
                    <OrgRoleBadge role="OWNER" />
                    <span className="text-[10px] text-muted-foreground">You (current)</span>
                  </div>

                  {/* Arrow */}
                  <div className="flex shrink-0 flex-col items-center gap-1">
                    <ArrowRight className="size-5 text-destructive" />
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-destructive">
                      transfers to
                    </span>
                  </div>

                  {/* New owner */}
                  <div className="flex flex-1 flex-col items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-3 text-center ring-1 ring-destructive/20">
                    <span className="flex size-9 items-center justify-center rounded-full bg-destructive/15 text-xs font-bold text-destructive">
                      {newOwnerInitials}
                    </span>
                    <p className="max-w-[100px] truncate text-[11px] font-medium text-foreground">
                      {member.user_email}
                    </p>
                    <OrgRoleBadge role={member.role} />
                    <span className="text-[10px] text-muted-foreground">New owner</span>
                  </div>
                </div>
              </div>

              {/* Consequence warnings */}
              <div className="space-y-2">
                <ConsequenceItem
                  text={`${member.user_email} will become the sole owner of ${orgName}.`}
                />
                <ConsequenceItem
                  text="You will be downgraded to Admin and lose ownership privileges."
                />
                <ConsequenceItem
                  text="This action takes effect immediately and cannot be reversed by you."
                />
              </div>

              {/* Confirmation input */}
              <div className="space-y-1.5">
                <Label htmlFor="confirm-org-name" className="text-sm font-medium text-foreground">
                  Type{" "}
                  <span className="font-mono font-semibold text-foreground">
                    {orgName}
                  </span>{" "}
                  to confirm
                </Label>
                <Input
                  ref={inputRef}
                  id="confirm-org-name"
                  type="text"
                  value={confirmText}
                  onChange={(e) => {
                    setConfirmText(e.target.value);
                    if (modalState.phase === "error") setModalState({ phase: "idle" });
                  }}
                  placeholder={orgName}
                  disabled={isTransferring}
                  autoComplete="off"
                  spellCheck={false}
                  aria-describedby="confirm-hint"
                  className={cn(
                    "h-10 font-mono transition-colors",
                    confirmationMatches
                      ? "border-success focus-visible:ring-success/30"
                      : confirmText.length > 0
                        ? "border-destructive/50 focus-visible:ring-destructive/20"
                        : "",
                  )}
                />
                <div className="min-h-[1.125rem]">
                  {confirmText.length > 0 && !confirmationMatches ? (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="size-3 shrink-0" />
                      Name doesn't match. Check for typos.
                    </p>
                  ) : confirmationMatches ? (
                    <p className="flex items-center gap-1 text-xs text-success">
                      <CheckCircle2 className="size-3 shrink-0" />
                      Confirmed. You may proceed.
                    </p>
                  ) : (
                    <p id="confirm-hint" className="text-xs text-muted-foreground">
                      This is case-sensitive.
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
                disabled={isTransferring}
              >
                Cancel
              </Button>
              <Button
                size="default"
                disabled={!canTransfer}
                onClick={handleTransfer}
                className={cn(
                  "min-w-[160px] gap-1.5 transition-all",
                  canTransfer
                    ? "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/50"
                    : "",
                )}
              >
                {isTransferring ? (
                  <>
                    <Spinner />
                    Transferring…
                  </>
                ) : (
                  <>
                    <Crown className="size-4" />
                    Transfer Ownership
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Consequence Item ─────────────────────────────────────────────────────────

function ConsequenceItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-warning/20 bg-warning/8 px-3.5 py-2.5">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
      <p className="text-xs text-warning leading-snug">{text}</p>
    </div>
  );
}

// ─── Success View ─────────────────────────────────────────────────────────────

function SuccessView({
  newOwnerEmail,
  orgName,
  onClose,
}: {
  newOwnerEmail: string;
  orgName: string;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-success/15">
        <CheckCircle2 className="size-7 text-success" />
      </span>

      <h3 className="text-base font-semibold text-foreground">Ownership transferred</h3>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{newOwnerEmail}</span> is now
        the owner of{" "}
        <span className="font-medium text-foreground">{orgName}</span>.
      </p>

      <p className="mt-3 text-xs text-muted-foreground">
        Your role has been changed to <span className="font-medium text-foreground">Admin</span>.
      </p>

      <Button size="default" onClick={onClose} className="mt-6 gap-1.5">
        Done
        <ArrowRight className="size-4" />
      </Button>
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
