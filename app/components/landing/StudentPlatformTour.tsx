"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

const FEATURES = [
  {
    id: "practice",
    label: "AI Practice",
    title: "Practice that adapts to you.",
    description:
      "Your AI generates drills from your actual mistakes — not generic textbook exercises. Five exercise types, streaks, and XP keep it fresh. You won't even realise you're studying.",
  },
  {
    id: "progress",
    label: "Track Progress",
    title: "Watch yourself improve.",
    description:
      "Detailed breakdowns of your vocabulary, grammar, listening, and speaking. Weekly reports and shareable Language Cards prove the work is paying off.",
  },
];

function PracticeVisual({ inView }: { inView: boolean }) {
  const words = ["Yo", "quiero", "aprender", "español"];

  return (
    <div className="rounded-2xl bg-[#3D2E23] p-6 sm:p-7">
      <div className="flex items-center gap-3 mb-5">
        <span className="text-xl">🇪🇸</span>
        <div>
          <p className="text-xs text-white/40">Daily Drill</p>
          <p className="text-sm text-white/70">Spanish · Intermediate</p>
        </div>
        <span className="ml-auto text-xs text-amber-400">🔥 7 streak</span>
      </div>

      <p className="text-white/50 text-sm mb-3">Build the sentence:</p>

      <div className="flex flex-wrap gap-2 mb-5 min-h-[36px]">
        {words.map((word, i) => (
          <motion.span
            key={word}
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 + i * 0.15, duration: 0.4, ease: EASE }}
            className="bg-primary/20 text-primary px-3 py-1.5 rounded-lg text-sm font-medium"
          >
            {word}
          </motion.span>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {["español", "aprender", "Yo", "quiero", "tengo", "casa"].map((word) => (
          <span
            key={`bank-${word}`}
            className="bg-white/[0.06] text-white/40 px-3 py-1.5 rounded-lg text-sm"
          >
            {word}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: "30%" }}
            animate={inView ? { width: "65%" } : {}}
            transition={{ delay: 0.8, duration: 1.2, ease: EASE }}
          />
        </div>
        <span className="text-xs text-white/40">+35 XP</span>
      </div>
    </div>
  );
}

function ProgressVisual({ inView }: { inView: boolean }) {
  const skills = [
    { name: "Vocabulary", pct: 72, color: "bg-primary" },
    { name: "Grammar", pct: 58, color: "bg-accent" },
    { name: "Listening", pct: 85, color: "bg-emerald-500" },
    { name: "Speaking", pct: 44, color: "bg-amber-500" },
  ];

  return (
    <div className="rounded-2xl bg-white border border-border p-6 sm:p-7 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm font-semibold text-foreground">Your Progress</p>
          <p className="text-xs text-muted-foreground">Spanish · Week 8</p>
        </div>
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.3 }}
          className="text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-medium"
        >
          +12% this week
        </motion.span>
      </div>

      <div className="space-y-4">
        {skills.map((skill, i) => (
          <div key={skill.name}>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-muted-foreground text-sm">{skill.name}</span>
              <span className="text-muted-foreground font-mono text-xs">{skill.pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${skill.color}`}
                initial={{ width: 0 }}
                animate={inView ? { width: `${skill.pct}%` } : { width: 0 }}
                transition={{ delay: 0.4 + i * 0.15, duration: 0.8, ease: EASE }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-base">
          🎯
        </div>
        <div>
          <p className="text-xs font-medium text-foreground">42 exercises completed</p>
          <p className="text-xs text-muted-foreground">7-day streak · Top 15%</p>
        </div>
      </div>
    </div>
  );
}

const VISUALS: Record<string, React.FC<{ inView: boolean }>> = {
  practice: PracticeVisual,
  progress: ProgressVisual,
};

export function StudentPlatformTour() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeFeature, setActiveFeature] = useState(0);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  const ActiveVisual = VISUALS[FEATURES[activeFeature].id];

  return (
    <section ref={sectionRef} className="relative py-14 sm:py-18 bg-secondary/50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-10">
          <p className="text-sm font-mono text-primary/60 mb-2">The platform</p>
          <h2 className="text-3xl sm:text-4xl tracking-tight text-foreground">
            Practice that works.{" "}
            <span className="text-muted-foreground">Progress you can see.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-[1fr,1.4fr] gap-8 md:gap-12 items-start">
          {/* Left: Feature tabs + description */}
          <div>
            {/* Tabs */}
            <div className="space-y-2 mb-6">
              {FEATURES.map((feature, index) => (
                <button
                  key={feature.id}
                  onClick={() => setActiveFeature(index)}
                  className={`
                    w-full text-left px-4 py-3.5 rounded-xl transition-all duration-300
                    ${
                      activeFeature === index
                        ? "bg-white shadow-md border border-border"
                        : "bg-transparent border border-transparent hover:bg-white/60"
                    }
                  `}
                >
                  <p className={`text-sm font-bold transition-colors ${
                    activeFeature === index ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {feature.label}
                  </p>
                  <p className={`text-sm mt-0.5 transition-colors ${
                    activeFeature === index ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {feature.title}
                  </p>
                </button>
              ))}
            </div>

            {/* Description */}
            <AnimatePresence mode="wait">
              <motion.p
                key={FEATURES[activeFeature].id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-muted-foreground leading-relaxed"
              >
                {FEATURES[activeFeature].description}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Right: Visual */}
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={FEATURES[activeFeature].id}
                initial={{ opacity: 0, x: 16, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -16, scale: 0.98 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <ActiveVisual inView={isInView} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
