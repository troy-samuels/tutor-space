import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "next-intl/server";
import { getLandingCopy } from "@/lib/constants/landing-copy";
import { Navigation } from "@/components/landing/Navigation";
import { Hero } from "@/components/landing/Hero";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PricingSection } from "@/components/landing/PricingSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { ValueStackSection } from "@/components/landing/ValueStackSection";
import { FinalCTASection } from "@/components/landing/FinalCTASection";
import { Footer } from "@/components/landing/Footer";
import { StructuredData } from "@/components/landing/StructuredData";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const locale = await getLocale();
  const copy = getLandingCopy(locale);

  return (
    <div className="min-h-screen bg-brand-white">
      <StructuredData faq={copy.faq} />
      <Navigation navigation={copy.navigation} />
      <Hero hero={copy.hero} socialProof={copy.socialProof} />
      <ProblemSection problems={copy.problems} />
      <SolutionSection solution={copy.solution} />
      <HowItWorks howItWorks={copy.howItWorks} />
      <PricingSection pricing={copy.pricing} />
      <ComparisonSection comparison={copy.comparison} />
      <TestimonialsSection testimonials={copy.testimonials} />
      <ValueStackSection valueStack={copy.valueStack} />
      <FAQSection faq={copy.faq} />
      <FinalCTASection finalCTA={copy.finalCTA} />
      <Footer footer={copy.footer} />
    </div>
  );
}
