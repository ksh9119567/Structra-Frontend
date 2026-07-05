"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  AtSign,
  CheckCircle2,
  AlertCircle,
  Save,
  Camera,
  Calendar,
  Shield,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { AuthUser } from "@/lib/auth/types";

type FieldErrors = Partial<Record<"username" | "first_name" | "last_name" | "phone_number", string>>;

export function ProfileView({ user: initialUser }: { user: AuthUser }) {
  const router = useRouter();

  const [user, setUser] = React.useState(initialUser);
  const [username, setUsername] = React.useState(initialUser.username ?? "");
  const [firstName, setFirstName] = React.useState(initialUser.first_name ?? "");
  const [lastName, setLastName] = React.useState(initialUser.last_name ?? "");
  const [phoneNumber, setPhoneNumber] = React.useState(initialUser.phone_number ?? "");

  const [saving, setSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});

  const displayName =
    user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.username;

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const joinedDate = new Date(user.date_joined).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isDirty =
    username !== (initialUser.username ?? "") ||
    firstName !== (initialUser.first_name ?? "") ||
    lastName !== (initialUser.last_name ?? "") ||
    phoneNumber !== (initialUser.phone_number ?? "");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);
    setFieldErrors({});

    if (!username.trim() || username.trim().length < 3) {
      setFieldErrors({ username: "Username must be at least 3 characters." });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone_number: phoneNumber.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.field) {
          setFieldErrors({ [data.field]: data.message });
        } else {
          setSaveError(data.message ?? "Failed to update profile.");
        }
        return;
      }

      // Update local state with fresh data from server
      setUser(data);
      setUsername(data.username ?? "");
      setFirstName(data.first_name ?? "");
      setLastName(data.last_name ?? "");
      setPhoneNumber(data.phone_number ?? "");
      setSaveSuccess(true);
      router.refresh(); // Refresh server components (topbar name)
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal information and account details.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Avatar + identity card */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="relative shrink-0">
              {user.profile_picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.profile_picture}
                  alt={displayName}
                  className="size-20 rounded-full object-cover ring-2 ring-border"
                />
              ) : (
                <span className="flex size-20 items-center justify-center rounded-full bg-primary/20 text-2xl font-bold text-primary ring-2 ring-border">
                  {initials}
                </span>
              )}
              <button
                type="button"
                aria-label="Change avatar"
                className="absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground"
              >
                <Camera className="size-3.5" />
              </button>
            </div>

            {/* Identity info */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg font-semibold text-foreground">{displayName}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                {user.is_email_verified ? (
                  <Badge color="success" icon={CheckCircle2}>Email verified</Badge>
                ) : (
                  <Badge color="warning" icon={AlertCircle}>Email unverified</Badge>
                )}
                {user.is_staff && (
                  <Badge color="primary" icon={Shield}>Staff</Badge>
                )}
              </div>
              <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground sm:justify-start">
                <Calendar className="size-3.5" />
                Joined {joinedDate}
              </div>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <form onSubmit={handleSave} className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-sm font-semibold text-foreground">Personal Information</h3>
            <p className="text-xs text-muted-foreground">Update your name, username, and contact details.</p>
          </div>

          <div className="grid gap-5 p-6 sm:grid-cols-2">
            {/* First name */}
            <FormField
              label="First name"
              id="first_name"
              icon={User}
              value={firstName}
              onChange={setFirstName}
              placeholder="John"
              autoComplete="given-name"
            />

            {/* Last name */}
            <FormField
              label="Last name"
              id="last_name"
              icon={User}
              value={lastName}
              onChange={setLastName}
              placeholder="Doe"
              autoComplete="family-name"
            />

            {/* Username */}
            <div className="sm:col-span-2">
              <FormField
                label="Username"
                id="username"
                icon={AtSign}
                value={username}
                onChange={setUsername}
                placeholder="johndoe"
                autoComplete="username"
                error={fieldErrors.username}
                required
              />
            </div>

            {/* Email — read-only */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="h-10 w-full rounded-md border border-border bg-muted pl-9 pr-3 text-sm text-muted-foreground cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            {/* Phone */}
            <div className="sm:col-span-2">
              <FormField
                label="Phone number"
                id="phone_number"
                icon={Phone}
                value={phoneNumber}
                onChange={setPhoneNumber}
                placeholder="+1 555 000 0000"
                autoComplete="tel"
                error={fieldErrors.phone_number}
                type="tel"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <div className="text-sm">
              {saveSuccess && (
                <span className="flex items-center gap-1.5 text-success">
                  <CheckCircle2 className="size-4" />
                  Profile updated successfully.
                </span>
              )}
              {saveError && (
                <span className="flex items-center gap-1.5 text-destructive">
                  <AlertCircle className="size-4" />
                  {saveError}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={saving || !isDirty}
              className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Spinner />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Save changes
                </>
              )}
            </button>
          </div>
        </form>

        {/* Account info card */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-sm font-semibold text-foreground">Account Details</h3>
          </div>
          <div className="divide-y divide-border/50">
            <InfoRow label="User ID" value={user.id} mono />
            <InfoRow label="Account status" value={user.is_active ? "Active" : "Inactive"} />
            <InfoRow label="Email verified" value={user.is_email_verified ? "Yes" : "No"} />
            <InfoRow label="Phone verified" value={user.is_phone_verified ? "Yes" : "No"} />
            <InfoRow label="Member since" value={joinedDate} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormField({
  label,
  id,
  icon: Icon,
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  required,
  type = "text",
}: {
  label: string;
  id: string;
  icon: React.ElementType;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          className={cn(
            "h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors",
            error ? "border-destructive" : "border-border",
          )}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Badge({
  color,
  icon: Icon,
  children,
}: {
  color: "success" | "warning" | "primary";
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  const styles = {
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    primary: "bg-primary/15 text-primary",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", styles[color])}>
      <Icon className="size-3" />
      {children}
    </span>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between px-6 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm text-foreground", mono && "font-mono text-xs")}>{value}</span>
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
