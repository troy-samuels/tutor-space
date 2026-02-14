"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const STUDENT_FAQS = [
  {
    question: "Is it really free to start?",
    answer:
      "Yes — completely free, no credit card needed. You can practise unlimited AI drills, take a level assessment, and browse all tutors without signing up. When you're ready for 1-on-1 lessons, you pay per lesson directly to your tutor.",
  },
  {
    question: "How is this different from Duolingo?",
    answer:
      "Duolingo is great for vocabulary, but it can't hold a conversation with you. TutorLingua combines gamified AI practice with real human tutors. The AI keeps you sharp between lessons; your tutor gives you personalised feedback, corrects your accent, and adapts to how you learn.",
  },
  {
    question: "How do I find the right tutor?",
    answer:
      "Browse our tutor directory filtered by language, price, availability, and specialty. Every tutor has ratings and reviews from real students. Book a trial lesson to see if it's a good fit — most tutors offer discounted first lessons.",
  },
  {
    question: "How much do lessons cost?",
    answer:
      "Tutors set their own prices. Lessons typically range from $15-40/hour depending on the tutor's experience and the language. You pay per lesson — no subscriptions, no hidden fees, and unlike marketplaces, tutors keep 100% of their fee.",
  },
  {
    question: "What languages are available?",
    answer:
      "We support 20+ languages for AI practice including Spanish, French, Japanese, Korean, German, Italian, Portuguese, Mandarin, and more. Our tutor directory covers even more languages — if someone teaches it, you'll find them here.",
  },
  {
    question: "Do I need to install anything?",
    answer:
      "No — TutorLingua works entirely in your browser on any device. Video lessons, AI practice, messaging, and progress tracking all happen on the web. You can add it to your home screen as a PWA for an app-like experience.",
  },
  {
    question: "Can I try the practice without signing up?",
    answer:
      "Absolutely. Hit 'Start learning for free' and you'll jump straight into a gamified practice session. No email, no password, no friction. Sign up later if you want to save your progress and streaks.",
  },
];

export function FAQStudentSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-background py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Questions? We've got answers.
          </h2>
        </div>

        <div className="divide-y divide-border">
          {STUDENT_FAQS.map((faq, index) => (
            <div key={index} className="py-5">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="text-base font-medium text-foreground pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-200",
                    openIndex === index && "rotate-180"
                  )}
                />
              </button>
              {openIndex === index && (
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                  {faq.answer}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
