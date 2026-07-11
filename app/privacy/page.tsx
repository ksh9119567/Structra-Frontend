import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { ComingSoon } from "@/features/shell/components/coming-soon";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <ComingSoon
      title="Privacy Policy"
      description="Our Privacy Policy is being finalized and will be published here soon."
      icon={ShieldCheck}
    />
  );
}
