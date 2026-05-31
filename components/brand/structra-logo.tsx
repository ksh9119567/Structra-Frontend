import * as React from "react";

import { cn } from "@/lib/utils";

type StructraMarkProps = React.SVGProps<SVGSVGElement> & {
  title?: string;
};

/**
 * Structra logo mark — a layered hexagonal "S" built from stacked chevrons.
 * Uses currentColor so it inherits the surrounding text color by default,
 * or override with a className / fill.
 */
export function StructraMark({
  className,
  title = "Structra",
  ...props
}: StructraMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label={title}
      className={cn("size-7", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M16 2.5 28 9v14l-12 6.5L4 23V9l12-6.5Z"
        className="fill-primary/15 stroke-primary"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M21 11.5c-1.2-1.3-3-2-5-2-2.8 0-4.7 1.4-4.7 3.4 0 2 1.6 2.8 4.6 3.3 3 .5 4.8 1.4 4.8 3.5 0 2.1-2 3.6-5 3.6-2.2 0-4.1-.8-5.3-2.2"
        className="stroke-primary"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type StructraLogoProps = {
  className?: string;
  /** Hide the wordmark, show only the mark. */
  markOnly?: boolean;
  /** Size of the mark. */
  size?: "sm" | "md" | "lg";
};

const markSize = {
  sm: "size-6",
  md: "size-7",
  lg: "size-9",
} as const;

const wordSize = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
} as const;

export function StructraLogo({
  className,
  markOnly = false,
  size = "md",
}: StructraLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <StructraMark className={markSize[size]} />
      {!markOnly ? (
        <span
          className={cn(
            "font-semibold tracking-tight text-foreground uppercase",
            wordSize[size],
          )}
        >
          Structra
        </span>
      ) : null}
    </span>
  );
}
