"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal, SlideIn } from "./motion";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const FAQS = [
  {
    q: "What's included for free?",
    a: "Free practice sessions every month, level assessments, streak tracking, and full access to the tutor directory. No credit card needed. Upgrade for unlimited practice and audio.",
  },
  {
    q: "How much do lessons cost?",
    a: "Lessons range from $15–40/hour depending on the tutor. You only pay when you book — no subscriptions, no platform fees, no hidden costs.",
  },
  {
    q: "Can I switch tutors?",
    a: "Anytime. Book with any tutor on the platform. Your progress and practice history stay with you.",
  },
  {
    q: "Is there a long-term commitment?",
    a: "No. Pay per lesson. Cancel or pause whenever you want. Your practice streaks and progress are always yours.",
  },
  {
    q: "How is this different from Duolingo?",
    a: "Duolingo teaches vocabulary. We combine real human tutors with practice that adapts to your actual weaknesses. You'll actually hold conversations.",
  },
];

export function PricingStudent() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="pricing" className="bg-background py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-xl mb-10 sm:mb-14">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
              Simple, transparent pricing.
            </h2>
            <p className="mt-6 text-xl text-muted-foreground leading-relaxed">
              Free to start. Pay only for the tutor hours you book.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-12 md:gap-20">
          {/* Left: Price model */}
          <SlideIn from="left">
            <div className="space-y-10">
              {/* Free tier */}
              <div>
                <p className="text-sm font-mono text-muted-foreground mb-2">Platform</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl sm:text-6xl font-bold text-foreground">Free</span>
                </div>
                <p className="mt-3 text-muted-foreground">
                  Practice, streaks, level assessments, tutor directory.
                  Everything you need to start learning — forever.
                </p>
              </div>

              {/* Lessons */}
              <div className="border-t border-border pt-10">
                <p className="text-sm font-mono text-muted-foreground mb-2">Lessons</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl sm:text-6xl font-bold text-foreground">$15</span>
                  <span className="text-xl text-muted-foreground">– $40/hr</span>
                </div>
                <p className="mt-3 text-muted-foreground">
                  Book a real tutor when you're ready. Pay per lesson,
                  no subscriptions, no commitments. Cancel anytime.
                </p>
              </div>

              <Link
                href="/practice"
                className="inline-flex rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
              >
                Start for free
              </Link>
            </div>
          </SlideIn>

          {/* Right: FAQ */}
          <SlideIn from="right">
            <div className="divide-y divide-border">
              {FAQS.map((faq, index) => (
                <div key={index} className="py-5">
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="flex w-full items-center justify-between text-left group"
                  >
                    <span className="text-base font-medium text-foreground pr-4 group-hover:text-primary transition-colors">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-300",
                        openIndex === index && "rotate-180 text-primary"
                      )}
                    />
                  </button>
                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <p className="pt-3 text-sm text-muted-foreground leading-relaxed">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </SlideIn>
        </div>
      </div>
    </section>
  );
}
