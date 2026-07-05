import { MarketingNav } from "@/features/marketing/components/marketing-nav";
import { HeroSection } from "@/features/marketing/components/hero-section";
import {
  CtaSection,
  FeaturesSection,
} from "@/features/marketing/components/features-section";
import { MarketingFooter } from "@/features/marketing/components/marketing-footer";
import { TrustedBy } from "@/features/marketing/components/trusted-by";

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <MarketingNav />
      <main className="flex-1">
        <HeroSection />
        <TrustedBy />
        <FeaturesSection />
        <CtaSection />
      </main>
      <MarketingFooter />
    </div>
  );
}
