"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LifetimeHero,
  LifetimeFeatures,
  LifetimeComparison,
  LifetimeFAQ,
  LifetimeCTA,
} from "@/components/lifetime";
import { Logo } from "@/components/Logo";

export function LifetimePageClient() {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/lifetime", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Failed to create checkout session:", data.error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-white">
      {/* Simple header */}
      <header className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo href="/" variant="wordmark" />
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-foreground transition-colors"
          >
            Already have an account? Log in
          </Link>
        </div>
      </header>

      {/* Main content with padding for fixed header */}
      <main className="pt-16">
        <LifetimeHero onCheckout={handleCheckout} isLoading={isLoading} />
        <LifetimeFeatures />
        <LifetimeComparison />
        <LifetimeFAQ />
        <LifetimeCTA onCheckout={handleCheckout} isLoading={isLoading} />
      </main>

      {/* Simple footer */}
      <footer className="bg-brand-black text-brand-white py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center gap-6 text-center">
            <Logo href="/" variant="wordmark" className="h-8 w-auto" />
            <p className="text-sm text-gray-400 max-w-md">
              The all-in-one platform for language tutors. Own your business, own your
              students.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <a
                href="mailto:hello@tutorlingua.co"
                className="hover:text-white transition-colors"
              >
                Contact
              </a>
            </div>
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} TutorLingua. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
