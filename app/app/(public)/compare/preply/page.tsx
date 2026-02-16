import type { Metadata } from "next";
import ComparisonPage from "@/components/compare/ComparisonPage";

export const metadata: Metadata = {
  title: "TutorLingua vs Preply: Why Independent Tutors Are Switching",
  description:
    "Compare TutorLingua and Preply side by side. See how commission rates, booking control, payment terms, and student management stack up for independent language tutors.",
  openGraph: {
    title: "TutorLingua vs Preply: The Commission-Free Alternative",
    description:
      "Independent tutors are switching from Preply to TutorLingua. Zero commission, full control over your students, and tools built for tutors who want independence.",
    type: "article",
    url: "/compare/preply",
  },
  alternates: {
    canonical: "/compare/preply",
    languages: {
      en: "/compare/preply",
      es: "/es/compare/preply",
      fr: "/fr/compare/preply",
      de: "/de/compare/preply",
    },
  },
};

export default function PreplyComparisonPage() {
  return (
    <ComparisonPage
      competitorName="Preply"
      competitorSlug="preply"
      title="TutorLingua vs Preply: Why Independent Tutors Are Switching"
      subtitle="Honest comparison"
      heroDescription="Preply is great for finding your first students. But once you have regulars, paying 18-33% commission on every lesson starts to feel less like a marketplace fee and more like a tax. Here's how the platforms compare."
      features={[
        {
          feature: "Commission rate",
          tutorlingua: "0% — always",
          competitor: "18-33% per lesson",
          highlight: true,
        },
        {
          feature: "Student ownership",
          tutorlingua: "You own the relationship",
          competitor: "Platform owns the student",
        },
        {
          feature: "Payment terms",
          tutorlingua: "Direct to you via Stripe",
          competitor: "5-day withdrawal window",
        },
        {
          feature: "Booking control",
          tutorlingua: "Full control, your schedule",
          competitor: "Platform-managed calendar",
        },
        {
          feature: "Price setting",
          tutorlingua: "Set any price, packages included",
          competitor: "Guided pricing, platform-influenced",
        },
        {
          feature: "AI lesson recaps",
          tutorlingua: "✅ 7 exercise types, multilingual",
          competitor: "❌ Not available",
          highlight: true,
        },
        {
          feature: "Student discovery",
          tutorlingua: "Profile page + SEO",
          competitor: "Marketplace search + algorithm",
        },
        {
          feature: "Reviews portability",
          tutorlingua: "Your profile, your reviews",
          competitor: "Locked to Preply",
        },
        {
          feature: "Cancellation policy",
          tutorlingua: "You set your own",
          competitor: "Platform-enforced rules",
        },
        {
          feature: "Free trial lessons",
          tutorlingua: "Optional, your choice",
          competitor: "Required for new students",
        },
      ]}
      painPoints={[
        {
          quote:
            "I've been on Preply for 2 years. They take 33% of my trial lessons and 18% of everything else. That's hundreds of pounds a month just for being on a platform.",
          source: "Tutor on r/Preply",
        },
        {
          quote:
            "The worst part is you can't take your reviews with you. I've got 200+ five-star reviews and they're all locked inside Preply.",
          source: "Tutor on r/OnlineESLTeaching",
        },
        {
          quote:
            "They find you ONE student and take 33% of every lesson FOREVER. The maths is mental once you actually add it up.",
          source: "Tutor community discussion",
        },
        {
          quote:
            "I finally calculated my actual hourly rate after Preply's commission. It was eye-opening. Going independent was the best decision I made.",
          source: "Tutor on r/freelance",
        },
      ]}
      whySwitchReasons={[
        "Keep 100% of what you earn — no commission on any lesson, ever. Your work, your income.",
        "Own your student relationships. When a student books with you, they're YOUR student. No platform in between.",
        "AI-powered lesson recaps with 7 interactive exercise types. Send students homework in 10 seconds. Nothing like this exists on Preply.",
        "Flexible pricing with packages, subscriptions, and one-off lessons. Set your rates without platform interference.",
        "Get paid directly through Stripe — no waiting periods, no minimum withdrawal amounts.",
        "Your profile, your brand. Build a presence that belongs to you, not to a marketplace that can change its algorithm overnight.",
      ]}
      otherComparisons={[
        { name: "iTalki", slug: "italki" },
        { name: "Cambly", slug: "cambly" },
      ]}
    />
  );
}
