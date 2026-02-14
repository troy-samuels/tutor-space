"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Search, CalendarCheck, Video, ArrowRight } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

const STEPS = [
  {
    icon: Search,
    title: "Find your tutor",
    desc: "Browse profiles by language, style, and price.",
  },
  {
    icon: CalendarCheck,
    title: "Book a session",
    desc: "See live availability. Pick a time. Done.",
  },
  {
    icon: Video,
    title: "Start learning",
    desc: "Crystal-clear video lessons in our classroom.",
  },
];

/** Browser-frame mockup of a tutor's booking page — what students actually see */
function TutorPagePreview({ inView }: { inView: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
      className="w-full max-w-md mx-auto lg:mx-0"
    >
      <div className="rounded-2xl bg-white border border-border shadow-xl overflow-hidden">
        {/* Browser bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-secondary border-b border-border">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
          </div>
          <div className="flex-1 mx-3">
            <div className="bg-secondary rounded-md px-3 py-1 text-[11px] text-muted-foreground text-center">
              tutorlingua.com/c/sofia-martinez
            </div>
          </div>
        </div>

        {/* Booking page content */}
        <div className="p-5">
          {/* Tutor header */}
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-200 to-orange-100 flex items-center justify-center text-base font-bold text-muted-foreground">
              SM
            </div>
            <div>
              <h4 className="text-base font-bold text-foreground">Sofia Martínez</h4>
              <p className="text-xs text-muted-foreground">Spanish · Portuguese · 4.9★ (128)</p>
            </div>
          </div>

          {/* Bio */}
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            12 years teaching conversational Spanish. Based in Barcelona.
            Specialising in travel and expat preparation.
          </p>

          {/* Availability */}
          <div className="bg-secondary rounded-xl p-3.5 mb-3">
            <p className="text-[11px] font-medium text-muted-foreground mb-2.5">Next available</p>
            <div className="grid grid-cols-3 gap-2">
              {["Mon 10:00", "Tue 14:00", "Thu 16:30"].map((slot, i) => (
                <motion.div
                  key={slot}
                  initial={{ opacity: 0, y: 6 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.3, ease: EASE }}
                  className="text-center py-2 rounded-lg bg-white border border-primary/20 text-xs font-medium text-primary"
                >
                  {slot}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Services */}
          <div className="space-y-2 mb-4">
            {[
              { name: "Trial Lesson (30 min)", price: "$11" },
              { name: "Conversational Spanish", price: "$22" },
              { name: "DELE Exam Prep", price: "$28" },
            ].map((service, i) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, x: -8 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.7 + i * 0.08, duration: 0.3, ease: EASE }}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary text-xs"
              >
                <span className="text-foreground font-medium">{service.name}</span>
                <span className="text-muted-foreground">{service.price}</span>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 1 }}
            className="bg-primary rounded-xl py-2.5 text-center text-sm font-semibold text-primary-foreground"
          >
            Book a lesson
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export function FeaturedTutors() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative py-14 sm:py-18 bg-[#FDF8F5] overflow-hidden">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Left: Copy + steps */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <p className="text-sm font-mono text-primary/60 mb-2">When you're ready</p>
            <h2 className="text-3xl sm:text-4xl tracking-tight text-foreground mb-3">
              Ready for the <span className="text-primary">real thing?</span>
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-8">
              AI gets you started. When you want personalised feedback and real conversation,
              book a tutor directly on their page — no commissions, no middlemen.
            </p>

            {/* How it works steps */}
            <div className="space-y-5">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, x: -12 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.3 + i * 0.15, duration: 0.4, ease: EASE }}
                    className="flex items-start gap-3.5"
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{step.title}</p>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <Link
              href="/tutors"
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
            >
              Browse tutors
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Right: Browser-frame preview of a tutor's booking page */}
          <TutorPagePreview inView={inView} />
        </div>
      </div>
    </section>
  );
}
