import { PricingSection } from "@/components/landing/PricingSection";
import { getLandingCopy } from "@/lib/constants/landing-copy";
import { defaultLocale } from "@/lib/i18n/config";

export const metadata = {
  title: "Pricing | TutorLingua",
  description: "Simple, transparent pricing for language tutors. Free trial, no credit card required.",
};

export default function PricingPage() {
  const landingCopy = getLandingCopy(defaultLocale);
  return (
    <main className="min-h-screen bg-background">
      <PricingSection pricing={landingCopy.pricing} />
    </main>
  );
}
