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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { loginRequest } from "@/lib/auth/client";
import { validateLogin, type FieldErrors } from "@/lib/auth/validation";
import { DASHBOARD_PATH } from "@/lib/auth/config";

export function LoginForm({ className }: { className?: string }) {
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  // Track which fields have been blurred so we don't yell while typing.
  const [touched, setTouched] = React.useState<{
    email?: boolean;
    password?: boolean;
  }>({});

  const emailErrorId = "login-email-error";
  const passwordErrorId = "login-password-error";

  function revalidate(next: { email?: string; password?: string }) {
    const { errors } = validateLogin({
      email: next.email ?? email,
      password: next.password ?? password,
    });
    setFieldErrors((prev) => ({
      email: touched.email ? errors.email : prev.email,
      password: touched.password ? errors.password : prev.password,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const { errors, valid } = validateLogin({ email, password });
    setTouched({ email: true, password: true });
    if (!valid) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    const result = await loginRequest({
      email: email.trim(),
      password,
      rememberMe,
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
      className={cn("flex w-full flex-col gap-5", className)}
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="h-11 pl-9"
            value={email}
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? emailErrorId : undefined}
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
          <p id={emailErrorId} className="text-xs text-destructive">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-primary hover:underline underline-offset-4"
            tabIndex={submitting ? -1 : undefined}
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Lock
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            className="h-11 px-9"
            value={password}
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={
              fieldErrors.password ? passwordErrorId : undefined
            }
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
          <p id={passwordErrorId} className="text-xs text-destructive">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      <Label
        htmlFor="remember-me"
        className="w-fit cursor-pointer text-sm font-normal text-muted-foreground"
      >
        <Checkbox
          id="remember-me"
          checked={rememberMe}
          disabled={submitting}
          onCheckedChange={(checked) => setRememberMe(checked === true)}
        />
        Remember me
      </Label>

      <Button
        type="submit"
        size="lg"
        disabled={submitting}
        className="h-11 w-full justify-center text-sm"
      >
        {submitting ? (
          <>
            <Spinner />
            Signing in…
          </>
        ) : (
          <>
            Sign in
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
