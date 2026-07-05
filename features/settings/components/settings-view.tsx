"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Shield,
  Bell,
  Palette,
  Trash2,
  ChevronRight,
  KeyRound,
  Mail,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { AuthUser } from "@/lib/auth/types";
import { LOGIN_PATH } from "@/lib/auth/config";

export function SettingsView({ user }: { user: AuthUser }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account security, notifications, and preferences.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Security section */}
        <SettingsSection
          icon={Shield}
          title="Security"
          description="Manage your password and account security."
        >
          <ChangePasswordForm user={user} />
        </SettingsSection>

        {/* Verification section */}
        <SettingsSection
          icon={Mail}
          title="Verification"
          description="Verify your email and phone number."
        >
          <VerificationPanel user={user} />
        </SettingsSection>

        {/* Notifications section */}
        <SettingsSection
          icon={Bell}
          title="Notifications"
          description="Control how and when you receive notifications."
        >
          <NotificationPreferences />
        </SettingsSection>

        {/* Appearance section */}
        <SettingsSection
          icon={Palette}
          title="Appearance"
          description="Customize the look and feel of Structra."
        >
          <AppearancePreferences />
        </SettingsSection>

        {/* Danger zone */}
        <DangerZone user={user} />
      </div>
    </div>
  );
}

// ─── Change Password ──────────────────────────────────────────────────────────

function ChangePasswordForm({ user }: { user: AuthUser }) {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  // OTP step
  const [otpStep, setOtpStep] = React.useState(false);
  const [otp, setOtp] = React.useState("");
  const [otpSaving, setOtpSaving] = React.useState(false);
  const [pendingNewPassword, setPendingNewPassword] = React.useState("");
  const [resetToken, setResetToken] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    if (!currentPassword) {
      setFieldErrors({ current_password: "Current password is required." });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setFieldErrors({ new_password: "New password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirm_password: "Passwords do not match." });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.field) {
          setFieldErrors({ [data.field]: data.message });
        } else {
          setError(data.message ?? "Failed to initiate password change.");
        }
        return;
      }

      // Backend sent OTP — move to OTP verification step
      setPendingNewPassword(newPassword);
      setOtpStep(true);
      setSuccess("An OTP has been sent to your email. Enter it below to confirm.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOtpSaving(true);

    try {
      // Step 1: Verify OTP and get reset token
      const verifyRes = await fetch("/api/auth/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "email",
          identifier: user.email,
          otp: otp.trim(),
        }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        setError(verifyData.message ?? "Invalid OTP.");
        return;
      }

      const token = verifyData.reset_token ?? verifyData.message;

      // Step 2: Reset password with token
      const resetRes = await fetch("/api/auth/forgot-password/reset", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reset_token: token,
          new_password: pendingNewPassword,
        }),
      });
      const resetData = await resetRes.json();

      if (!resetRes.ok) {
        setError(resetData.message ?? "Failed to reset password.");
        return;
      }

      // Success — clear form
      setOtpStep(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOtp("");
      setPendingNewPassword("");
      setSuccess("Password changed successfully.");
      setTimeout(() => setSuccess(null), 4000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setOtpSaving(false);
    }
  }

  if (otpStep) {
    return (
      <form onSubmit={handleOtpVerify} className="flex flex-col gap-4">
        {success && <StatusBanner type="success" message={success} />}
        {error && <StatusBanner type="error" message={error} />}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="otp" className="text-sm font-medium text-foreground">
            Verification code
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="h-10 w-40 rounded-md border border-border bg-background px-3 text-center text-lg font-mono tracking-widest text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
          <p className="text-xs text-muted-foreground">
            Enter the 6-digit code sent to {user.email}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={otpSaving || otp.length < 6}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {otpSaving ? <><Spinner /> Verifying…</> : <><KeyRound className="size-4" /> Verify & change password</>}
          </button>
          <button
            type="button"
            onClick={() => { setOtpStep(false); setError(null); setSuccess(null); }}
            className="flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {success && <StatusBanner type="success" message={success} />}
      {error && <StatusBanner type="error" message={error} />}

      <PasswordField
        id="current_password"
        label="Current password"
        value={currentPassword}
        onChange={setCurrentPassword}
        show={showCurrent}
        onToggleShow={() => setShowCurrent((v) => !v)}
        error={fieldErrors.current_password}
        autoComplete="current-password"
      />
      <PasswordField
        id="new_password"
        label="New password"
        value={newPassword}
        onChange={setNewPassword}
        show={showNew}
        onToggleShow={() => setShowNew((v) => !v)}
        error={fieldErrors.new_password}
        autoComplete="new-password"
        hint="Minimum 6 characters."
      />
      <PasswordField
        id="confirm_password"
        label="Confirm new password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        show={showConfirm}
        onToggleShow={() => setShowConfirm((v) => !v)}
        error={fieldErrors.confirm_password}
        autoComplete="new-password"
      />

      <div>
        <button
          type="submit"
          disabled={saving}
          className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? <><Spinner /> Sending OTP…</> : <><Lock className="size-4" /> Change password</>}
        </button>
      </div>
    </form>
  );
}

// ─── Verification Panel ───────────────────────────────────────────────────────

function VerificationPanel({ user }: { user: AuthUser }) {
  return (
    <div className="flex flex-col gap-3">
      <VerificationRow
        label="Email address"
        value={user.email}
        verified={user.is_email_verified}
        onVerify={() => {}}
      />
      <VerificationRow
        label="Phone number"
        value={user.phone_number ?? "Not set"}
        verified={user.is_phone_verified}
        disabled={!user.phone_number}
        onVerify={() => {}}
      />
    </div>
  );
}

function VerificationRow({
  label,
  value,
  verified,
  disabled,
  onVerify,
}: {
  label: string;
  value: string;
  verified: boolean;
  disabled?: boolean;
  onVerify: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{value}</p>
      </div>
      {verified ? (
        <span className="flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
          <CheckCircle2 className="size-3.5" /> Verified
        </span>
      ) : (
        <button
          onClick={onVerify}
          disabled={disabled}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Verify now
        </button>
      )}
    </div>
  );
}

// ─── Notification Preferences ─────────────────────────────────────────────────

const NOTIFICATION_PREFS = [
  { id: "task_assigned", label: "Task assigned to me", description: "When a task is assigned to you", defaultOn: true },
  { id: "approval_requested", label: "Approval requested", description: "When someone requests your approval", defaultOn: true },
  { id: "mention", label: "Mentions", description: "When someone mentions you in a comment", defaultOn: true },
  { id: "project_update", label: "Project updates", description: "When a project you're in is updated", defaultOn: false },
  { id: "system", label: "System notifications", description: "Platform updates and announcements", defaultOn: false },
];

function NotificationPreferences() {
  const [prefs, setPrefs] = React.useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_PREFS.map((p) => [p.id, p.defaultOn])),
  );

  return (
    <div className="flex flex-col gap-3">
      {NOTIFICATION_PREFS.map((pref) => (
        <div key={pref.id} className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{pref.label}</p>
            <p className="text-xs text-muted-foreground">{pref.description}</p>
          </div>
          <Toggle
            checked={prefs[pref.id]}
            onChange={(v) => setPrefs((p) => ({ ...p, [pref.id]: v }))}
          />
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        Notification preferences are stored locally. Full backend support coming soon.
      </p>
    </div>
  );
}

// ─── Appearance ───────────────────────────────────────────────────────────────

function AppearancePreferences() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Dark mode</p>
          <p className="text-xs text-muted-foreground">Structra uses dark mode by default.</p>
        </div>
        <Toggle checked={true} onChange={() => {}} disabled />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Compact sidebar</p>
          <p className="text-xs text-muted-foreground">Use the collapse button in the sidebar to toggle.</p>
        </div>
        <span className="text-xs text-muted-foreground">Use sidebar toggle</span>
      </div>
    </div>
  );
}

// ─── Danger Zone ──────────────────────────────────────────────────────────────

function DangerZone({ user }: { user: AuthUser }) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleDelete() {
    if (confirmText !== user.email) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/user/profile", { method: "DELETE" });
      if (res.ok) {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.message ?? "Failed to delete account.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-xl border border-destructive/30 bg-card">
      <div className="border-b border-destructive/30 px-6 py-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-destructive">
          <Trash2 className="size-4" />
          Danger Zone
        </h3>
        <p className="text-xs text-muted-foreground">
          Irreversible actions. Proceed with caution.
        </p>
      </div>
      <div className="p-6">
        {!confirming ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Delete account</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete your account and all associated data. This cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setConfirming(true)}
              className="flex h-9 items-center gap-2 rounded-lg border border-destructive/50 px-4 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 className="size-4" />
              Delete account
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {error && <StatusBanner type="error" message={error} />}
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive">
                This will permanently delete your account.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Type <span className="font-mono font-semibold text-foreground">{user.email}</span> to confirm.
              </p>
            </div>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={user.email}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50"
            />
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={confirmText !== user.email || deleting}
                className="flex h-9 items-center gap-2 rounded-lg bg-destructive px-4 text-sm font-semibold text-white transition-colors hover:bg-destructive/90 disabled:opacity-50"
              >
                {deleting ? <><Spinner /> Deleting…</> : "Permanently delete account"}
              </button>
              <button
                onClick={() => { setConfirming(false); setConfirmText(""); setError(null); }}
                className="flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-4 text-primary" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  error,
  autoComplete,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  error?: string;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          className={cn(
            "h-10 w-full rounded-md border bg-background pl-9 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors",
            error ? "border-destructive" : "border-border",
          )}
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-4" : "translate-x-0",
        )}
      />
    </button>
  );
}

function StatusBanner({ type, message }: { type: "success" | "error"; message: string }) {
  const styles = {
    success: "border-success/30 bg-success/10 text-success",
    error: "border-destructive/30 bg-destructive/10 text-destructive",
  };
  const Icon = type === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div className={cn("flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm", styles[type])}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
