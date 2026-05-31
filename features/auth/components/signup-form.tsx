"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { signupRequest } from "@/lib/auth/client";
import { validateSignup, type FieldErrors } from "@/lib/auth/validation";
import { DASHBOARD_PATH } from "@/lib/auth/config";

export function SignupForm({ className }: { className?: string }) {
  const router = useRouter();

  const [username, setUsername] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [agreeTerms, setAgreeTerms] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [touched, setTouched] = React.useState<
    Partial<Record<"username" | "email" | "password" | "confirmPassword", boolean>>
  >({});

  const ids = {
    username: "signup-username-error",
    email: "signup-email-error",
    password: "signup-password-error",
    confirmPassword: "signup-confirm-error",
  };

  function revalidate(next: Partial<{
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }>) {
    const { errors } = validateSignup({
      username: next.username ?? username,
      email: next.email ?? email,
      password: next.password ?? password,
      confirmPassword: next.confirmPassword ?? confirmPassword,
    });
    setFieldErrors((prev) => ({
      username: touched.username ? errors.username : prev.username,
      email: touched.email ? errors.email : prev.email,
      password: touched.password ? errors.password : prev.password,
      confirmPassword: touched.confirmPassword
        ? errors.confirmPassword
        : prev.confirmPassword,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const { errors, valid } = validateSignup({
      username,
      email,
      password,
      confirmPassword,
    });
    setTouched({
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
    if (!valid) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    if (!agreeTerms) {
      setFormError("You must agree to the terms and conditions.");
      return;
    }

    setSubmitting(true);
    const result = await signupRequest({
      username: username.trim(),
      email: email.trim(),
      password,
      confirmPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
    setSubmitting(false);

    if (result.ok) {
      router.push(DASHBOARD_PATH);
      router.refresh();
      return;
    }

    if (result.errors) setFieldErrors(result.errors);
    setFormError(result.message);
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn("flex w-full flex-col gap-4", className)}
    >
      {formError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          <span>{formError}</span>
        </div>
      ) : null}

      {/* Username */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <User
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder="johndoe"
            className="h-11 pl-9"
            value={username}
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.username)}
            aria-describedby={fieldErrors.username ? ids.username : undefined}
            onChange={(e) => {
              setUsername(e.target.value);
              if (touched.username) revalidate({ username: e.target.value });
            }}
            onBlur={() => {
              setTouched((t) => ({ ...t, username: true }));
              revalidate({});
            }}
          />
        </div>
        {fieldErrors.username ? (
          <p id={ids.username} className="text-xs text-destructive">
            {fieldErrors.username}
          </p>
        ) : null}
      </div>

      {/* First & Last Name */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="first-name">First name</Label>
          <Input
            id="first-name"
            name="firstName"
            type="text"
            autoComplete="given-name"
            placeholder="John"
            className="h-11"
            value={firstName}
            disabled={submitting}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="last-name">Last name</Label>
          <Input
            id="last-name"
            name="lastName"
            type="text"
            autoComplete="family-name"
            placeholder="Doe"
            className="h-11"
            value={lastName}
            disabled={submitting}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>

      {/* Email */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-email">Email address</Label>
        <div className="relative">
          <Mail
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="signup-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="h-11 pl-9"
            value={email}
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? ids.email : undefined}
            onChange={(e) => {
              setEmail(e.target.value);
              if (touched.email) revalidate({ email: e.target.value });
            }}
            onBlur={() => {
              setTouched((t) => ({ ...t, email: true }));
              revalidate({});
            }}
          />
        </div>
        {fieldErrors.email ? (
          <p id={ids.email} className="text-xs text-destructive">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <Lock
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="signup-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Min. 6 characters"
            className="h-11 px-9"
            value={password}
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? ids.password : undefined}
            onChange={(e) => {
              setPassword(e.target.value);
              if (touched.password) revalidate({ password: e.target.value });
            }}
            onBlur={() => {
              setTouched((t) => ({ ...t, password: true }));
              revalidate({});
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            disabled={submitting}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute right-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        {fieldErrors.password ? (
          <p id={ids.password} className="text-xs text-destructive">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      {/* Confirm Password */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-confirm">Confirm password</Label>
        <div className="relative">
          <Lock
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="signup-confirm"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            className="h-11 px-9"
            value={confirmPassword}
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
            aria-describedby={
              fieldErrors.confirmPassword ? ids.confirmPassword : undefined
            }
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (touched.confirmPassword)
                revalidate({ confirmPassword: e.target.value });
            }}
            onBlur={() => {
              setTouched((t) => ({ ...t, confirmPassword: true }));
              revalidate({});
            }}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            disabled={submitting}
            aria-label={showConfirm ? "Hide password" : "Show password"}
            aria-pressed={showConfirm}
            className="absolute right-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {showConfirm ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        {fieldErrors.confirmPassword ? (
          <p id={ids.confirmPassword} className="text-xs text-destructive">
            {fieldErrors.confirmPassword}
          </p>
        ) : null}
      </div>

      {/* Terms */}
      <Label
        htmlFor="agree-terms"
        className="w-fit cursor-pointer text-sm font-normal text-muted-foreground"
      >
        <Checkbox
          id="agree-terms"
          checked={agreeTerms}
          disabled={submitting}
          onCheckedChange={(checked) => setAgreeTerms(checked === true)}
        />
        I agree to the{" "}
        <Link
          href="/terms"
          className="font-medium text-primary hover:underline underline-offset-4"
          tabIndex={-1}
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="font-medium text-primary hover:underline underline-offset-4"
          tabIndex={-1}
        >
          Privacy Policy
        </Link>
      </Label>

      <Button
        type="submit"
        size="lg"
        disabled={submitting}
        className="mt-1 h-11 w-full justify-center text-sm"
      >
        {submitting ? (
          <>
            <Spinner />
            Creating account…
          </>
        ) : (
          <>
            Create account
            <ArrowRight data-icon="inline-end" className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}

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
