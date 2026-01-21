"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchFAQs, type FAQItem } from "@/app/(public)/faq/faq-data";
import { FAQAccordion } from "./faq-accordion";

interface FAQSearchProps {
  className?: string;
}

export function FAQSearch({ className }: FAQSearchProps) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<FAQItem[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        setResults(searchFAQs(query));
        setIsSearching(true);
      } else {
        setResults([]);
        setIsSearching(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsSearching(false);
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Search Input */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search FAQs..."
          className="w-full pl-12 pr-12 py-4 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {isSearching && (
        <div className="mt-8 max-w-4xl mx-auto">
          {results.length > 0 ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Found {results.length} result{results.length !== 1 ? "s" : ""} for &quot;{query}&quot;
              </p>
              <div className="bg-white rounded-2xl border border-gray-100 px-6 shadow-sm">
                <FAQAccordion items={results} />
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">
                No results found for &quot;{query}&quot;
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Try different keywords or browse the categories below
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
