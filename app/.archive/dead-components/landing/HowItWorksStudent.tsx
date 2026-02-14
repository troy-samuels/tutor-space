"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CalendarCheck, Video } from "lucide-react";
import { Reveal } from "./motion";

const EASE = [0.22, 1, 0.36, 1] as const;

const STEPS = [
  {
    id: "find",
    number: "01",
    title: "Find your match.",
    description:
      "Browse tutors by language, price, and teaching style. Read real reviews. See who's online now.",
    icon: Search,
  },
  {
    id: "book",
    number: "02",
    title: "Book with a click.",
    description:
      "See live availability. Pick a time. We handle time zones, reminders, and rescheduling.",
    icon: CalendarCheck,
  },
  {
    id: "learn",
    number: "03",
    title: "Start learning.",
    description:
      "Crystal-clear video lessons. Your tutor assigns personalised practice after every session.",
    icon: Video,
  },
];

function StepVisual({ stepId }: { stepId: string }) {
  if (stepId === "find") {
    const items = [
      { name: "Sofia M.", lang: "Spanish", rating: "4.9★", price: "$22/hr" },
      { name: "Yuki T.", lang: "Japanese", rating: "5.0★", price: "$28/hr" },
      { name: "Pierre D.", lang: "French", rating: "4.8★", price: "$19/hr" },
    ];
    return (
      <div className="space-y-3">
        {items.map((item, i) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4, ease: EASE }}
            className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-stone-200 to-stone-100 flex items-center justify-center text-xs font-bold text-stone-500">
                {item.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <p className="text-sm font-medium text-stone-700">{item.name}</p>
                <p className="text-xs text-stone-400">{item.lang}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-amber-600">{item.rating}</p>
              <p className="text-xs text-stone-400">{item.price}</p>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (stepId === "book") {
    const slots = [
      { day: "Mon", time: "10:00", booked: false },
      { day: "Tue", time: "14:00", booked: false },
      { day: "Wed", time: "09:00", booked: true },
      { day: "Thu", time: "16:00", booked: false },
      { day: "Fri", time: "11:00", booked: false },
    ];
    return (
      <div className="grid grid-cols-5 gap-2">
        {slots.map((slot, i) => (
          <motion.div
            key={slot.day}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35, ease: EASE }}
            className={`text-center p-3 rounded-xl border ${
              slot.booked
                ? "bg-stone-50 border-stone-100 opacity-40"
                : "bg-primary/5 border-primary/15"
            }`}
          >
            <p className="text-xs font-medium text-stone-500">{slot.day}</p>
            <p className={`text-sm font-semibold mt-1 ${slot.booked ? "text-stone-400" : "text-primary"}`}>
              {slot.time}
            </p>
          </motion.div>
        ))}
      </div>
    );
  }

  // learn
  return (
    <div className="space-y-4">
      <div className="aspect-video rounded-xl bg-gradient-to-br from-stone-100 to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-white/80 mx-auto flex items-center justify-center shadow-sm">
            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-stone-400 ml-0.5" />
          </div>
          <p className="text-xs text-stone-400 mt-2">42:16</p>
        </div>
      </div>
      <div className="flex gap-2">
        {["HD Video", "Shared Notes", "AI Summary"].map((f) => (
          <span key={f} className="text-[11px] bg-stone-100 text-stone-500 px-2.5 py-1 rounded-full">
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}

export function HowItWorksStudent() {
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-step"));
            if (!isNaN(idx)) setActiveStep(idx);
          }
        });
      },
      { rootMargin: "-30% 0px -30% 0px", threshold: 0 }
    );

    const steps = sectionRef.current?.querySelectorAll("[data-step]");
    steps?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="bg-background py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground max-w-xl mb-10 sm:mb-14">
            Your path to fluency.
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
          {/* Left: Steps */}
          <div className="space-y-12 sm:space-y-14">
            {STEPS.map((step, index) => {
              const isActive = activeStep === index;
              return (
                <div
                  key={step.id}
                  data-step={index}
                  className={`transition-opacity duration-400 ${isActive ? "opacity-100" : "opacity-30"}`}
                >
                  <span className="text-sm font-mono text-primary/50">{step.number}</span>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-1 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-base text-stone-500 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right: Sticky visual */}
          <div className="hidden md:block">
            <div className="sticky top-32">
              <div className="rounded-2xl bg-white border border-stone-200 shadow-lg overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-stone-50 border-b border-stone-100">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-200" />
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-200" />
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-200" />
                  </div>
                  <span className="text-[11px] text-stone-400 ml-2">
                    {STEPS[activeStep].title}
                  </span>
                </div>
                <div className="p-5">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={STEPS[activeStep].id}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.4, ease: EASE }}
                    >
                      <StepVisual stepId={STEPS[activeStep].id} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: show all visuals inline */}
          <div className="md:hidden space-y-8">
            {STEPS.map((step) => (
              <Reveal key={step.id}>
                <div className="rounded-2xl bg-white border border-stone-200 shadow-sm p-5">
                  <p className="text-xs text-stone-400 mb-3">{step.title}</p>
                  <StepVisual stepId={step.id} />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
