import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "next-intl/server";
import { getLandingCopy } from "@/lib/constants/landing-copy";
import { defaultLocale, locales, type Locale } from "@/lib/i18n/config";
import { GlobalNav } from "@/components/landing/GlobalNav";
import { HeroStudent } from "@/components/landing/HeroStudent";
import { PracticeHook } from "@/components/landing/PracticeHook";
import { StudentPlatformTour } from "@/components/landing/StudentPlatformTour";
import { FeaturedTutors } from "@/components/landing/FeaturedTutors";
import { PricingStudent } from "@/components/landing/PricingStudent";
import { FinalCTAStudent } from "@/components/landing/FinalCTAStudent";
import { Footer } from "@/components/landing/Footer";
import { LandingPrefetch } from "@/components/landing/LandingPrefetch";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Learn Any Language — AI Practice & Expert Tutors | TutorLingua",
  description:
    "The fun way to master a new language. Gamified AI practice between lessons, 1-on-1 video tutoring, and progress tracking. Start for free — no signup needed.",
  keywords: [
    "learn a language",
    "language learning",
    "AI language practice",
    "find a language tutor",
    "online language lessons",
  ],
  openGraph: {
    title: "Learn Any Language | TutorLingua",
    description: "AI-powered practice + real tutors. The complete path to fluency.",
    type: "website",
    url: "/",
  },
};

export default async function StudentLandingPage() {
  let user = null;
  try {
    const supabase = await createClient();
    const response = await supabase.auth.getUser();
    user = response.data?.user ?? null;
  } catch (error) {
    console.error("[StudentLandingPage] Failed to resolve user for redirect", error);
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
    console.error("[StudentLandingPage] Failed to resolve locale", error);
  }

  const copy = getLandingCopy(locale);

  return (
    <div id="page-top" className="min-h-screen bg-brand-white">
      <LandingPrefetch />
      <GlobalNav
        navigation={copy.navigation}
        isAuthenticated={false}
        audience="student"
      />

      {/* 1. Hero — floating language pills, rotating greetings */}
      <HeroStudent />

      {/* 2. Practice hook — try an exercise right now (dark, interactive) */}
      <PracticeHook />

      {/* 3. Platform showcase — sticky tabs: AI Practice + Progress */}
      <StudentPlatformTour />

      {/* 4. The human element — editorial tutor feature + how it works */}
      <FeaturedTutors />

      {/* 5. Pricing + FAQ */}
      <PricingStudent />

      {/* 6. Final CTA */}
      <FinalCTAStudent />

      <Footer footer={copy.footer} />
    </div>
  );
}
