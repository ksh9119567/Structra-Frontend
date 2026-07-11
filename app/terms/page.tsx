import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { ComingSoon } from "@/features/shell/components/coming-soon";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <ComingSoon
      title="Terms of Service"
      description="Our Terms of Service are being finalized and will be published here soon."
      icon={FileText}
    />
  );
}
