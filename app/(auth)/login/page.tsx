import type { Metadata } from "next";
import Link from "next/link";

import { StructraLogo, StructraMark } from "@/components/brand/structra-logo";
import { LoginForm } from "@/features/auth/components/login-form";
import { AuthHighlights } from "@/features/auth/components/auth-highlights";
import { SsoButton } from "@/features/auth/components/sso-button";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to continue to Structra.",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Left: form panel */}
      <section className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
        <div className="flex w-full max-w-sm flex-col">
          <StructraLogo size="md" className="mb-10" />

          <header className="mb-7">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to continue to{" "}
              <span className="font-medium text-primary">Structra</span>
            </p>
          </header>

          <LoginForm />

          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground">
              OR
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <SsoButton className="h-11 w-full justify-center" />

          <p className="mt-7 text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-primary hover:underline underline-offset-4"
            >
              Create one
            </Link>
          </p>
        </div>
      </section>

      {/* Right: branded showcase (hidden on small screens) */}
      <aside className="relative hidden overflow-hidden bg-card lg:flex">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(120%_120%_at_80%_0%,color-mix(in_oklch,var(--primary),transparent_55%)_0%,transparent_45%)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,var(--foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--foreground)_1px,transparent_1px)] [background-size:44px_44px]"
        />

        <div className="relative z-10 flex flex-1 flex-col justify-between p-12">
          <div className="flex justify-end">
            <StructraMark className="size-12 opacity-90" />
          </div>

          <div className="max-w-md">
            <h2 className="text-4xl font-semibold leading-tight tracking-tight text-foreground">
              Build. Manage. Govern.
              <br />
              <span className="text-primary">All in one place.</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Structra is the enterprise platform to streamline projects, tasks,
              teams, and governance.
            </p>

            <AuthHighlights className="mt-9 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2" />
          </div>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Structra. All rights reserved.
          </p>
        </div>
      </aside>
    </main>
  );
}
