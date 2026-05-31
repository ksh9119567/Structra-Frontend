import * as React from "react";
import { Box, Cloud, Hexagon, Layers, Triangle } from "lucide-react";

const COMPANIES = [
  { icon: Box, name: "Acme Corp" },
  { icon: Triangle, name: "Vertex" },
  { icon: Hexagon, name: "Innova" },
  { icon: Layers, name: "Bytecraft" },
  { icon: Cloud, name: "Cloudex" },
];

export function TrustedBy() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-8">
      <p className="text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Trusted by teams at
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
        {COMPANIES.map(({ icon: Icon, name }) => (
          <span
            key={name}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
          >
            <Icon className="size-4" />
            {name}
          </span>
        ))}
      </div>
    </section>
  );
}
