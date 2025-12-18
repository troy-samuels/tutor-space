"use client";

import { useState } from "react";
import type { LandingCopy } from "@/lib/constants/landing-copy";
import { cn } from "@/lib/utils";

type FAQSectionProps = {
  faq: LandingCopy["faq"];
};

export function FAQSection({ faq }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-brand-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {faq.headline}
          </h2>
        </div>

        <div className="mt-16 space-y-4">
          {faq.items.map((item, index) => (
            <div
              key={index}
              className="rounded-2xl bg-muted overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left transition-colors hover:bg-muted/80"
              >
                <span className="text-lg font-semibold text-foreground pr-8">
                  {item.question}
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
                  {item.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
