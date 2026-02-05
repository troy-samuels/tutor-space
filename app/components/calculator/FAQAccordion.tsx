"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type FAQItem = {
  question: string;
  answer: string;
};

type FAQAccordionProps = {
  items: FAQItem[];
};

export function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
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
  );
}
