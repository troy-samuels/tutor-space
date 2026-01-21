"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FAQItem, FAQCategory } from "@/app/(public)/faq/faq-data";

interface FAQAccordionItemProps {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQAccordionItem({ item, isOpen, onToggle }: FAQAccordionItemProps) {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg"
        aria-expanded={isOpen}
      >
        <span className="text-base font-medium text-gray-900 pr-4 group-hover:text-blue-600">
          {item.question}
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 flex-shrink-0 text-gray-400 transition-transform duration-200",
            isOpen && "rotate-180 text-blue-600"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <p className="pb-5 pr-12 text-gray-600 leading-relaxed">{item.answer}</p>
      </div>
    </div>
  );
}

interface FAQAccordionProps {
  items: FAQItem[];
  allowMultiple?: boolean;
}

export function FAQAccordion({ items, allowMultiple = true }: FAQAccordionProps) {
  const [openItems, setOpenItems] = React.useState<Set<string>>(new Set());

  const handleToggle = (itemId: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        if (!allowMultiple) {
          newSet.clear();
        }
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  return (
    <div className="divide-y divide-gray-100">
      {items.map((item) => (
        <FAQAccordionItem
          key={item.id}
          item={item}
          isOpen={openItems.has(item.id)}
          onToggle={() => handleToggle(item.id)}
        />
      ))}
    </div>
  );
}

interface FAQCategorySectionProps {
  category: FAQCategory;
  isExpanded?: boolean;
}

export function FAQCategorySection({ category, isExpanded = false }: FAQCategorySectionProps) {
  return (
    <section id={category.id} className="scroll-mt-24">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{category.title}</h2>
        <p className="text-gray-600">{category.description}</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 px-6 shadow-sm">
        <FAQAccordion items={category.items} />
      </div>
    </section>
  );
}
