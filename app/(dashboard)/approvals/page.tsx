import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { ComingSoon } from "@/features/shell/components/coming-soon";

export const metadata: Metadata = { title: "Approvals" };

export default function ApprovalsPage() {
  return (
    <ComingSoon
      title="Approvals"
      description="Review and act on pending governance approvals, policy changes, and workflow requests."
      icon={ShieldCheck}
    />
  );
}
