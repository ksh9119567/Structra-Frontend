import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  ShieldCheck,
  Users,
} from "lucide-react";

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Task Management",
    description: "Plan, organize, and track tasks across teams with ease.",
  },
  {
    icon: ShieldCheck,
    title: "Governance & Compliance",
    description: "Enforce policies, approvals, and compliance at every step.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Collaborate seamlessly with roles, permissions, and activity tracking.",
  },
  {
    icon: BarChart3,
    title: "Real-time Insights",
    description:
      "Get real-time insights and reports to make data-driven decisions.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="border-t border-border/60 bg-card/30">
      <div className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Everything you need to
            <br className="hidden sm:block" /> manage work and governance
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Structra brings projects, tasks, teams, and governance together in a
            unified platform built for scale.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="group flex flex-col rounded-xl border border-border bg-background p-5 transition-colors hover:border-primary/40"
            >
              <span className="flex size-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
              <Link
                href="/login"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary"
              >
                Learn more
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CtaSection() {
  return (
    <section className="border-t border-border/60">
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/[0.07] px-8 py-10 sm:px-12">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(100%_100%_at_100%_0%,color-mix(in_oklch,var(--primary),transparent_60%)_0%,transparent_55%)]"
          />
          <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Ready to transform the way your team works?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Join Structra and build the future of work, today.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              Get Started Free
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
