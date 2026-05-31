import * as React from "react";
import Link from "next/link";
import { ArrowRight, CircleCheck, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductPreview } from "./product-preview";

const TRUST_BADGES = [
  { icon: CircleCheck, label: "Enterprise Ready" },
  { icon: ShieldCheck, label: "Secure by Design" },
  { icon: Sparkles, label: "Scalable Platform" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_50%_-10%,color-mix(in_oklch,var(--primary),transparent_70%)_0%,transparent_60%)]"
      />
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
        <div className="flex flex-col">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" />
            Enterprise Task Management &amp; Governance Platform
          </span>

          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
            Build. Manage. Govern.
            <br />
            <span className="text-primary">All in one place.</span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            Structra helps organizations streamline work, enforce governance,
            and deliver projects with clarity and control.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-11">
              <Link href="/login">
                Get Started
                <ArrowRight data-icon="inline-end" className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11">
              <Link href="#features">Book a Demo</Link>
            </Button>
          </div>

          <ul className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Icon className="size-4 text-primary" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}
