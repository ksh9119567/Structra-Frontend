import * as React from "react";
import Link from "next/link";
import { AtSign, Globe, MessageCircle } from "lucide-react";

import { StructraLogo } from "@/components/brand/structra-logo";

const FOOTER_COLUMNS: { heading: string; links: string[] }[] = [
  { heading: "Product", links: ["Features", "Integrations", "Changelog", "Roadmap"] },
  { heading: "Solutions", links: ["Project Management", "IT & Operations", "Governance", "Enterprise"] },
  { heading: "Resources", links: ["Documentation", "Guides", "Blog", "Support"] },
  { heading: "Company", links: ["About Us", "Careers", "Contact", "Privacy Policy"] },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="col-span-2 md:col-span-1">
            <StructraLogo size="md" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The enterprise platform to manage tasks, projects, teams and
              governance — all in one place.
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading} className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold tracking-wide text-foreground uppercase">
                {column.heading}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Structra. All rights reserved.
          </p>
          <div className="flex items-center gap-1">
            {[
              { icon: MessageCircle, label: "Community" },
              { icon: Globe, label: "Website" },
              { icon: AtSign, label: "Contact" },
            ].map(({ icon: Icon, label }) => (
              <Link
                key={label}
                href="#"
                aria-label={label}
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon className="size-4" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
