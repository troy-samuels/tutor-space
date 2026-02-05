import type { Metadata } from "next";
import { EarningsCalculator } from "@/components/calculator/EarningsCalculator";
import { FAQAccordion } from "@/components/calculator/FAQAccordion";

export const metadata: Metadata = {
  title: "Tutor Earnings Calculator - See Your Real Hourly Rate | TutorLingua",
  description:
    "Calculate your true earnings after Preply, iTalki, or Verbling fees. See how much you could save with 0% commission on direct bookings.",
  keywords: [
    "tutor earnings calculator",
    "Preply commission calculator",
    "iTalki fees",
    "tutoring income calculator",
    "Preply fees calculator",
    "Verbling commission",
    "online tutor salary calculator",
    "tutoring platform fees comparison",
    "tutor take home pay",
    "language tutor earnings",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://calculator.tutorlingua.co",
    title: "Tutor Earnings Calculator - See Your Real Hourly Rate | TutorLingua",
    description:
      "Calculate your true earnings after Preply, iTalki, or Verbling fees. See how much you could save with 0% commission on direct bookings.",
    siteName: "TutorLingua",
    images: [
      {
        url: "/og-image.png?v=2",
        width: 1200,
        height: 630,
        alt: "Tutor Earnings Calculator - TutorLingua",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tutor Earnings Calculator - See Your Real Hourly Rate",
    description:
      "Calculate your true earnings after platform fees. See how much you could save with TutorLingua's 0% commission.",
    images: ["/og-image.png?v=2"],
  },
  alternates: {
    canonical: "https://calculator.tutorlingua.co",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const FAQ_ITEMS = [
  {
    question: "Do I need to leave Preply/iTalki to use TutorLingua?",
    answer:
      "No! TutorLingua is designed to complement marketplaces, not replace them. Use Preply, iTalki, or Verbling to find new students. Once they become repeat students, move them to TutorLingua where you keep 100% of your earnings with 0% commission.",
  },
  {
    question: "How accurate are these commission calculations?",
    answer:
      "We use the standard published commission rates for each platform. Preply charges 33% for your first 20 hours with new students, then drops to 18%. iTalki and Verbling charge ~15% flat. Cambly pays a fixed rate of approximately $10.20/hour regardless of your listed rate.",
  },
  {
    question: "Does TutorLingua really have 0% commission?",
    answer:
      "Yes! TutorLingua charges a flat monthly fee (from $29/month) instead of taking a percentage of your earnings. You keep 100% of what your students pay you. Standard payment processing fees from Stripe or PayPal still apply (~2.9% + $0.30).",
  },
  {
    question: "What features do I get with TutorLingua?",
    answer:
      "TutorLingua includes everything you need to run your tutoring business: professional booking pages, payment processing, student CRM with notes and progress tracking, calendar integrations, automated reminders, digital product sales, and AI-powered lesson tools. All in one platform.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes! TutorLingua offers a 14-day free trial with full access to all features. No credit card required to start. Cancel anytime if it's not right for you.",
  },
];

export default function CalculatorPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              How Much Are You{" "}
              <span className="text-primary">Really</span> Earning?
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-gray-700 lg:text-xl">
              Marketplace platforms take 15-33% of every lesson. Calculate your true
              earnings and see how much you could save by keeping your repeat
              students on TutorLingua.
            </p>
          </div>

          {/* Calculator */}
          <EarningsCalculator />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mt-16">
            <FAQAccordion items={FAQ_ITEMS} />
          </div>
        </div>
      </section>
    </>
  );
}
