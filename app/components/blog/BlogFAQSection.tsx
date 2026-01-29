"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FAQItem } from "@/lib/blog";

interface BlogFAQAccordionItemProps {
  item: FAQItem;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}

function BlogFAQAccordionItem({ item, index, isOpen, onToggle }: BlogFAQAccordionItemProps) {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-4 text-left transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${index}`}
      >
        <span className="text-base font-medium text-gray-900 pr-4">
          {item.question}
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 flex-shrink-0 text-gray-400 transition-transform duration-200",
            isOpen && "rotate-180 text-primary"
          )}
        />
      </button>
      <div
        id={`faq-answer-${index}`}
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <p className="pb-4 pr-12 text-gray-600 leading-relaxed">{item.answer}</p>
      </div>
    </div>
  );
}

interface BlogFAQSectionProps {
  faqs: FAQItem[];
  articleTitle: string;
}

export function BlogFAQSection({ faqs, articleTitle }: BlogFAQSectionProps) {
  const [openItems, setOpenItems] = React.useState<Set<number>>(new Set([0])); // First item open by default

  const handleToggle = (index: number) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  if (!faqs || faqs.length === 0) {
    return null;
  }

  return (
    <section className="my-12 scroll-mt-24" aria-labelledby="faq-heading">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
          <HelpCircle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 id="faq-heading" className="text-xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-gray-500">
            Common questions about this topic
          </p>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="bg-gray-50 rounded-2xl border border-gray-100 px-6">
        {faqs.map((faq, index) => (
          <BlogFAQAccordionItem
            key={index}
            item={faq}
            index={index}
            isOpen={openItems.has(index)}
            onToggle={() => handleToggle(index)}
          />
        ))}
      </div>

      {/* Link to main FAQ page */}
      <div className="mt-4 text-center">
        <Link
          href="/faq"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View all FAQs
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
