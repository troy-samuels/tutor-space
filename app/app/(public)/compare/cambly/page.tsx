import type { Metadata } from "next";
import ComparisonPage from "@/components/compare/ComparisonPage";

export const metadata: Metadata = {
  title: "TutorLingua vs Cambly: For Tutors Who Want Control",
  description:
    "Compare TutorLingua and Cambly for English tutors. Escape fixed rates, set your own prices, and build a real tutoring business with commission-free tools.",
  openGraph: {
    title: "TutorLingua vs Cambly: For Tutors Who Want Control",
    description:
      "Cambly pays a flat rate. TutorLingua lets you set your own prices, keep 100% of your earnings, and build a real tutoring business. Compare the platforms.",
    type: "article",
    url: "/compare/cambly",
  },
  alternates: {
    canonical: "/compare/cambly",
  },
};

export default function CamblyComparisonPage() {
  return (
    <ComparisonPage
      competitorName="Cambly"
      competitorSlug="cambly"
      title="TutorLingua vs Cambly: For Tutors Who Want Control"
      subtitle="Honest comparison"
      heroDescription="Cambly is easy to start with — log in, chat, get paid. But $0.17/minute ($10.20/hour) with zero control over your schedule, students, or curriculum isn't a career. It's a gig. Here's the alternative."
      features={[
        {
          feature: "Hourly rate",
          tutorlingua: "You set it — £15-£80+/hr",
          competitor: "$10.20/hr (fixed rate)",
          highlight: true,
        },
        {
          feature: "Commission",
          tutorlingua: "0%",
          competitor: "Platform sets your rate",
        },
        {
          feature: "Schedule control",
          tutorlingua: "Full control, your terms",
          competitor: "Priority Hours system",
          highlight: true,
        },
        {
          feature: "Student selection",
          tutorlingua: "Accept who you want",
          competitor: "Random matching",
        },
        {
          feature: "Curriculum freedom",
          tutorlingua: "Teach what you want",
          competitor: "Platform curriculum encouraged",
        },
        {
          feature: "AI lesson recaps",
          tutorlingua: "✅ 7 exercise types, multilingual",
          competitor: "❌ Not available",
          highlight: true,
        },
        {
          feature: "Student relationships",
          tutorlingua: "Direct, long-term",
          competitor: "Often one-off conversations",
        },
        {
          feature: "Payment terms",
          tutorlingua: "Direct Stripe, flexible",
          competitor: "Weekly PayPal/bank transfer",
        },
        {
          feature: "Lesson types",
          tutorlingua: "Structured + conversation",
          competitor: "Primarily conversation",
        },
        {
          feature: "Growth potential",
          tutorlingua: "Build a real business",
          competitor: "Capped at flat rate",
        },
      ]}
      painPoints={[
        {
          quote:
            "I did the maths. At $10.20/hour on Cambly, working 30 hours a week, that's £1,200/month before tax. You can't build a life on that in the UK.",
          source: "Tutor on r/OnlineESLTeaching",
        },
        {
          quote:
            "The Priority Hours system is a trap. You commit to being available at certain times, but there's no guarantee students will show up. You just sit there waiting.",
          source: "Tutor on r/WorkOnline",
        },
        {
          quote:
            "Cambly treats tutors like interchangeable parts. Any tutor, any topic, any time. There's no way to specialise or charge more for expertise.",
          source: "Tutor community discussion",
        },
        {
          quote:
            "Had a great regular on Cambly for 6 months. She wanted to book more lessons but the platform wouldn't let her choose specific times with me. She left.",
          source: "Tutor on r/freelance",
        },
      ]}
      whySwitchReasons={[
        "Set your own rates based on your experience, specialisation, and demand. Top tutors on TutorLingua charge £40-80/hour — that's 4-8x Cambly's fixed rate.",
        "Build real relationships with students. No random matching — students find you, book you, and come back because they chose YOU.",
        "AI-powered lesson recaps turn every lesson into interactive homework. 7 exercise types, generated in 10 seconds. Your students actually practise between sessions.",
        "Specialise and charge accordingly. Teach Business English at a premium. Offer exam prep. Create packages. On Cambly, everyone's worth $10.20/hour regardless.",
        "Your schedule, your rules. No Priority Hours, no penalties for not being online at specific times. Accept bookings when it works for you.",
        "Transition gradually. Keep Cambly for now while building your independent student base on TutorLingua. No obligation, no lock-in.",
      ]}
      otherComparisons={[
        { name: "Preply", slug: "preply" },
        { name: "iTalki", slug: "italki" },
      ]}
    />
  );
}
