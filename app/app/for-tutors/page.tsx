import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "next-intl/server";
import { getLandingCopy } from "@/lib/constants/landing-copy";
import { defaultLocale, locales, type Locale } from "@/lib/i18n/config";
import { GlobalNav } from "@/components/landing/GlobalNav";
import { HeroTutor } from "@/components/landing/HeroTutor";
import { TutorValueProps } from "@/components/landing/TutorValueProps";
import { TutorAISection } from "@/components/landing/TutorAISection";
import { TutorSiteBuilder } from "@/components/landing/TutorSiteBuilder";
import { PricingSection } from "@/components/landing/PricingSection";
import { TutorDifferentiators } from "@/components/landing/TutorDifferentiators";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { FinalCTASection } from "@/components/landing/FinalCTASection";
import { FinalCTATutor } from "@/components/landing/FinalCTATutor";
import { Footer } from "@/components/landing/Footer";
import { StructuredData } from "@/components/landing/StructuredData";
import { LandingPrefetch } from "@/components/landing/LandingPrefetch";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The All-in-One Platform for Language Tutors | TutorLingua",
  description:
    "Bookings, payments, student management, and AI lesson tools in one place. Free to start. No commission. Set up in 15 minutes.",
  openGraph: {
    title: "The All-in-One Platform for Language Tutors | TutorLingua",
    description: "Everything you need to run your tutoring business.",
    type: "website",
    url: "/for-tutors",
  },
};

export default async function TutorLandingPage() {
  let user = null;
  try {
    const supabase = await createClient();
    const response = await supabase.auth.getUser();
    user = response.data?.user ?? null;
  } catch (error) {
    console.error("[TutorLandingPage] Failed to resolve user", error);
  }

  if (user) {
    redirect("/dashboard");
  }

  let locale: Locale = defaultLocale;
  try {
    const detected = await getLocale();
    const normalized = detected?.toLowerCase?.() ?? "";
    if ((locales as readonly string[]).includes(normalized)) {
      locale = normalized as Locale;
    }
  } catch (error) {
    console.error("[TutorLandingPage] Failed to resolve locale", error);
  }

  const copy = getLandingCopy(locale);

  return (
    <div id="page-top" className="min-h-screen bg-brand-white">
      <StructuredData faq={copy.faq} />
      <LandingPrefetch />
      <GlobalNav
        navigation={copy.navigation}
        isAuthenticated={false}
        audience="tutor"
      />

      {/* 1. Hero — product explanation + dashboard preview */}
      <HeroTutor />

      {/* 2. AI Teaching Assistant — killer feature, high up */}
      <TutorAISection copy={copy.studioIntelligence} />

      {/* 3. Core value props — scheduling, payments, student CRM */}
      <TutorValueProps />

      {/* 4. Booking site builder */}
      <TutorSiteBuilder />

      {/* 5. Pricing */}
      <PricingSection pricing={copy.pricing} />

      {/* 6. Why TutorLingua (replaces old comparison) */}
      <TutorDifferentiators comparison={copy.comparison} />

      {/* 7. Testimonials */}
      <TestimonialsSection testimonials={copy.testimonials} />

      {/* 8. FAQ */}
      <FAQSection faq={copy.faq} />

      {/* 9. Earnings calculator */}
      <FinalCTASection finalCTA={copy.finalCTA} />

      {/* 10. Final CTA */}
      <FinalCTATutor />

      <Footer footer={copy.footer} />
    </div>
  );
}
