import type { Metadata } from "next";
import ComparisonPage from "@/components/compare/ComparisonPage";

export const metadata: Metadata = {
  title: "TutorLingua vs iTalki: The Commission-Free Alternative",
  description:
    "Compare TutorLingua and iTalki for language tutors. Zero commission vs 15%, direct payments, AI lesson recaps, and full student ownership.",
  openGraph: {
    title: "TutorLingua vs iTalki: The Commission-Free Alternative",
    description:
      "Stop paying 15% on every lesson. TutorLingua gives independent tutors the tools to manage students without marketplace commission.",
    type: "article",
    url: "/compare/italki",
  },
  alternates: {
    canonical: "/compare/italki",
    languages: {
      en: "/compare/italki",
      es: "/es/compare/italki",
      fr: "/fr/compare/italki",
      de: "/de/compare/italki",
    },
  },
};

export default function iTalkiComparisonPage() {
  return (
    <ComparisonPage
      competitorName="iTalki"
      competitorSlug="italki"
      title="TutorLingua vs iTalki: The Commission-Free Alternative"
      subtitle="Honest comparison"
      heroDescription="iTalki built a massive community of language learners and tutors. But their 15% commission — plus the recent UX changes and payment delays — has tutors looking for alternatives. Here's how we compare."
      features={[
        {
          feature: "Commission rate",
          tutorlingua: "0% — always",
          competitor: "15% per lesson",
          highlight: true,
        },
        {
          feature: "Teacher vs Community Tutor",
          tutorlingua: "One tier — you're a tutor",
          competitor: "Two tiers with different pricing",
        },
        {
          feature: "Payment processing",
          tutorlingua: "Direct Stripe, instant",
          competitor: "iTalki Credits system",
        },
        {
          feature: "Minimum withdrawal",
          tutorlingua: "None",
          competitor: "$30 minimum",
        },
        {
          feature: "AI lesson recaps",
          tutorlingua: "✅ 7 exercise types, multilingual",
          competitor: "❌ Not available",
          highlight: true,
        },
        {
          feature: "Lesson packages",
          tutorlingua: "Full package + subscription support",
          competitor: "Basic package options",
        },
        {
          feature: "Student data ownership",
          tutorlingua: "Full access, exportable",
          competitor: "Platform-controlled",
        },
        {
          feature: "Languages supported",
          tutorlingua: "All languages",
          competitor: "130+ languages",
        },
        {
          feature: "Custom branding",
          tutorlingua: "Your profile, your brand",
          competitor: "Standard iTalki profile",
        },
        {
          feature: "Cancellation flexibility",
          tutorlingua: "You set your own policy",
          competitor: "Platform-set rules",
        },
      ]}
      painPoints={[
        {
          quote:
            "iTalki changed their interface AGAIN and now half my students can't find the reschedule button. Every time they 'improve' the UX, I lose bookings.",
          source: "Tutor on r/iTalki",
        },
        {
          quote:
            "Fewer lessons in 2026. Is it just me or has anyone else noticed a proper drop-off? I don't know if it's AI or the platform's algorithm burying me.",
          source: "Tutor discussion, February 2026",
        },
        {
          quote:
            "15% doesn't sound like much until you do 100 hours a month. That's 15 hours of work going straight to iTalki for what — a search listing?",
          source: "Tutor on r/OnlineESLTeaching",
        },
        {
          quote:
            "The credit system means students pre-pay iTalki, not you. If there's a dispute, the platform holds YOUR money while they sort it out.",
          source: "Tutor community discussion",
        },
      ]}
      whySwitchReasons={[
        "Keep 100% of your earnings. No commission, no credits system, no minimum withdrawal. Your money is your money.",
        "One type of tutor — no 'Professional Teacher' vs 'Community Tutor' divide. You set your own rates based on your value.",
        "AI lesson recaps that generate interactive homework in 10 seconds. 7 exercise types including listening, matching, and translation. Students love it.",
        "Get paid in real currency, directly. No iTalki Credits middleman. Stripe handles everything — fast, reliable, global.",
        "No algorithm anxiety. Your profile doesn't get buried because you took a week off. Build a stable base of students who come directly to you.",
        "Export your student data. Your lesson history, notes, and contacts belong to you. Take them anywhere.",
      ]}
      otherComparisons={[
        { name: "Preply", slug: "preply" },
        { name: "Cambly", slug: "cambly" },
      ]}
    />
  );
}
