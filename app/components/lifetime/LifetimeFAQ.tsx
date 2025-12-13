"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "What exactly do I get with the lifetime deal?",
    answer:
      "You get full access to every feature on TutorLingua, forever. This includes the booking system, student CRM, custom website builder, payment processing, messaging, analytics, digital product sales, and all future features we add. There are no hidden fees or upsells.",
  },
  {
    question: "What does 'lifetime' mean?",
    answer:
      "Lifetime means as long as TutorLingua exists and operates, you'll have access. We're committed to building this platform for the long term. Your one-time payment gives you permanent access to the platform and all future updates.",
  },
  {
    question: "Do I need to create an account before paying?",
    answer:
      "No! You can pay first, then create your account. After payment, you'll be directed to create your TutorLingua account. The lifetime access will be automatically applied to your account based on your payment email.",
  },
  {
    question: "Can I get a refund if it's not right for me?",
    answer:
      "Yes. We offer a 14-day money-back guarantee. If TutorLingua isn't the right fit for your tutoring business, contact us within 14 days of purchase for a full refund, no questions asked.",
  },
  {
    question: "Are there any transaction fees?",
    answer:
      "TutorLingua charges 0% platform fees on your bookings. When you accept payments from students, you'll only pay Stripe's standard processing fees (typically 2.9% + 30¢). We don't take a cut of your earnings.",
  },
  {
    question: "What happens after December 3rd, 2025?",
    answer:
      "After the deadline, the $99 lifetime deal will no longer be available. We'll switch to our regular monthly pricing of $39/month.",
  },
  {
    question: "I already have a TutorLingua account. Can I upgrade?",
    answer:
      "This offer is for new signups only. If you already have an account, please contact our support team to discuss upgrade options.",
  },
  {
    question: "Is my payment secure?",
    answer:
      "Absolutely. All payments are processed through Stripe, one of the world's most trusted payment providers. We never see or store your credit card details.",
  },
];

export function LifetimeFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-muted py-20 sm:py-24">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Everything you need to know about the lifetime deal.
          </p>
        </div>

        <div className="mt-16 space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-2xl bg-white overflow-hidden transition-all shadow-sm"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left transition-colors hover:bg-gray-50"
              >
                <span className="text-lg font-semibold text-foreground pr-8">
                  {faq.question}
                </span>
                <svg
                  className={cn(
                    "h-6 w-6 flex-none text-primary transition-transform",
                    openIndex === index ? "rotate-180" : ""
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <div
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  openIndex === index ? "max-h-96" : "max-h-0"
                )}
              >
                <div className="px-6 pb-6 text-gray-700 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
