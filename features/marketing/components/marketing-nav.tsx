"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StructraLogo } from "@/components/brand/structra-logo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Product", href: "#features" },
  { label: "Solutions", href: "#solutions" },
  { label: "Resources", href: "#resources" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];

export function MarketingNav() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <Link href="/" aria-label="Structra home">
            <StructraLogo size="md" />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="default">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="default">
            <Link href="/login">Get Started</Link>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="flex size-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:hidden"
        >
          <Menu className={cn("size-5", open && "hidden")} />
          <X className={cn("size-5", !open && "hidden")} />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-t border-border/60 md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-6 py-4" aria-label="Mobile">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2">
            <Button asChild variant="outline" className="justify-center">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild className="justify-center">
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
