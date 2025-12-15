import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "next-intl/server";
import { getLandingCopy } from "@/lib/constants/landing-copy";
import { defaultLocale, locales, type Locale } from "@/lib/i18n/config";
import { Navigation } from "@/components/landing/Navigation";
import { Hero } from "@/components/landing/Hero";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { PhoneMockupSection } from "@/components/landing/PhoneMockupSection";
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
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowDown, ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  let user = null;
  try {
    const supabase = await createClient();
    const response = await supabase.auth.getUser();
    user = response.data?.user ?? null;
  } catch (error) {
    console.error("[LandingPage] Failed to resolve user for redirect", error);
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
    console.error("[LandingPage] Failed to resolve locale", error);
  }

  const copy = getLandingCopy(locale);

  return (
    <div className="min-h-screen bg-brand-white">
      <StructuredData faq={copy.faq} />
      {/* User reaching this point is definitively NOT authenticated (redirected otherwise).
          Pass isAuthenticated={false} to skip loading state entirely. */}
      <Navigation navigation={copy.navigation} isAuthenticated={false} />
      <Hero hero={copy.hero} socialProof={copy.socialProof} />
      <ProblemSection problems={copy.problems} />
      <PhoneMockupSection copy={copy.phoneMockup} />
      <SolutionSection solution={copy.solution} />
      <HowItWorks howItWorks={copy.howItWorks} />

      {/* Studio Intelligence Section */}
      <section className="bg-[#FDF8F5] py-24">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mx-auto rounded-full border border-stone-200 bg-white px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-stone-700 shadow-none">
              {copy.studioIntelligence.badge}
            </Badge>
            <h2 className="mt-6 text-4xl md:text-5xl font-serif text-foreground">
              {copy.studioIntelligence.headline}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              {copy.studioIntelligence.subheadline}
            </p>
          </div>

          {/* Main Container - Vertical Flow */}
          <div className="space-y-6">
            {/* Panel 1: Live Transcript */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Recording Header */}
              <div className="flex items-center gap-3 px-6 py-3 border-b bg-stone-50">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
                <span className="text-sm font-medium text-foreground">{copy.studioIntelligence.transcript.recordingLabel}</span>
                <span className="text-sm text-muted-foreground ml-auto">{copy.studioIntelligence.transcript.timer}</span>
              </div>

              {/* Transcript Content */}
              <div className="p-6 space-y-4">
                {/* Line 1 - Tutor */}
                <div className="flex gap-3">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide w-16 shrink-0 pt-0.5">
                    {copy.studioIntelligence.transcript.tutorLabel}
                  </span>
                  <p className="text-sm text-foreground">{copy.studioIntelligence.transcript.lines[0]}</p>
                </div>

                {/* Line 2 - Student with error highlight */}
                <div className="flex gap-3">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide w-16 shrink-0 pt-0.5">
                    {copy.studioIntelligence.transcript.studentLabel}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      {copy.studioIntelligence.transcript.mispronouncedPrefix}
                      <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">
                        {copy.studioIntelligence.transcript.mispronouncedWord}
                      </span>
                      {copy.studioIntelligence.transcript.mispronouncedSuffix}
                    </p>
                    <span className="inline-flex items-center gap-1 mt-1 text-xs text-orange-600">
                      <AlertCircle className="h-3 w-3" />
                      {copy.studioIntelligence.transcript.mispronouncedHint}
                    </span>
                  </div>
                </div>

                {/* Line 3 - Tutor correction */}
                <div className="flex gap-3">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide w-16 shrink-0 pt-0.5">
                    {copy.studioIntelligence.transcript.tutorLabel}
                  </span>
                  <p className="text-sm text-foreground">{copy.studioIntelligence.transcript.correction}</p>
                </div>

                {/* Line 4 - Student improved */}
                <div className="flex gap-3">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide w-16 shrink-0 pt-0.5">
                    {copy.studioIntelligence.transcript.studentLabel}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                        {copy.studioIntelligence.transcript.correctedWord}
                      </span>
                    </p>
                    <span className="inline-flex items-center gap-1 mt-1 text-xs text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                      {copy.studioIntelligence.transcript.correctionHint}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Arrow Connector */}
            <div className="flex justify-center py-2">
              <div className="flex flex-col items-center gap-1">
                <ArrowDown className="h-6 w-6 text-primary" />
                <span className="text-xs text-muted-foreground font-medium">{copy.studioIntelligence.connector}</span>
              </div>
            </div>

            {/* Panel 2: Two-Column - Struggles → Homework */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Left: Detected Struggles */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-serif text-lg text-foreground mb-4">{copy.studioIntelligence.detectedTitle}</h3>
                <div className="space-y-3">
                  {copy.studioIntelligence.detected.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100"
                    >
                      <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{item.word}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-orange-400 shrink-0 mt-2 hidden md:block" />
                    </div>
                  ))}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{copy.studioIntelligence.vocab.title}</p>
                      <p className="text-xs text-muted-foreground">{copy.studioIntelligence.vocab.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-blue-400 shrink-0 mt-2 hidden md:block" />
                  </div>
                </div>
              </div>

              {/* Right: Generated Homework */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-primary">
                <h3 className="font-serif text-lg text-foreground mb-4">{copy.studioIntelligence.practiceTitle}</h3>
                <div className="space-y-3">
                  {copy.studioIntelligence.practice.map((item, index) => (
                    <div key={index} className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">{item.description}</p>
                    </div>
                  ))}
                </div>

                {/* Footer Note */}
                <div className="mt-4 pt-4 border-t border-stone-100 flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span>{copy.studioIntelligence.saveNote}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
