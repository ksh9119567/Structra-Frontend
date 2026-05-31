import * as React from "react";
import { KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Single sign-on entry point. The backend does not yet expose an SSO endpoint,
 * so this is rendered as disabled with a "coming soon" hint rather than wired
 * to a dead route. Swap `disabled` off once the provider flow exists.
 */
export function SsoButton({ className }: { className?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      disabled
      title="SSO is coming soon"
      className={className}
    >
      <KeyRound data-icon="inline-start" className="size-4" />
      Sign in with SSO
    </Button>
  );
}
