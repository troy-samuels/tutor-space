"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap, Users, Trophy } from "lucide-react";
import { LANGUAGES } from "@/lib/practice/catalogue-bridge";
import { useState, useEffect } from "react";
import { Leaderboard } from "./Leaderboard";

interface SplashScreenProps {
  onStart: () => void;
  languageHint?: string | null;
  tutorDisplayName?: string | null;
  topicHint?: string | null;
}

const kineticPhrases = [
  "Speak Spanish.",
  "Master French.",
  "Learn German.",
  "Practice Japanese.",
];

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

export default function SplashScreen({
  onStart,
  languageHint = null,
  tutorDisplayName = null,
  topicHint = null,
}: SplashScreenProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);

  // Cycle through kinetic phrases
  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % kineticPhrases.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-[100dvh] justify-center items-center relative px-6 overflow-hidden">
      {/* Particle field - floating dots */}
      {[...Array(25)].map((_, i) => {
        const color = i % 2 === 0 ? "var(--primary)" : "var(--accent)";
        const size = Math.random() * 4 + 2;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const duration = Math.random() * 10 + 15;
        const delay = Math.random() * 5;

        return (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: size,
              height: size,
              backgroundColor: color,
              opacity: 0.15,
              left: `${x}%`,
              top: `${y}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.1, 0.25, 0.1],
            }}
            transition={{
              duration,
              repeat: Infinity,
              delay,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        className="relative z-10 text-center"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-xl bg-white/[0.08] border border-white/[0.12] mb-6 shadow-[0_0_20px_-10px_rgba(232,120,77,0.2)]"
        >
          <Zap className="w-3 h-3 text-primary" />
          <span className="text-xs text-primary font-medium">
            Free · No signup required
          </span>
        </motion.div>

        {/* Kinetic typography - animated headline */}
        <div className="mb-3">
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-center mb-2">
            <AnimatePresence mode="wait">
              <motion.span
                key={phraseIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="block text-primary"
              >
                {kineticPhrases[phraseIndex]}
              </motion.span>
            </AnimatePresence>
            <span className="block text-foreground">Powered by AI.</span>
          </h1>
        </div>

        <p className="text-muted-foreground text-base text-center px-2">
          Interactive exercises, instant feedback, and a score you can share.
          Takes 2 minutes.
        </p>
      </motion.div>

      {/* Language pills */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex gap-2 overflow-x-auto px-6 py-6 no-scrollbar w-full justify-center flex-wrap max-w-md relative z-10"
      >
        {LANGUAGES.map((lang, i) => (
          <motion.span
            key={lang.code}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.3 + i * 0.05,
              type: "spring",
              stiffness: 200,
            }}
            className="shrink-0 px-4 py-2 rounded-full backdrop-blur-md bg-white/[0.04] border border-white/[0.08] text-sm text-foreground shadow-sm"
          >
            {lang.flag} {lang.name}
          </motion.span>
        ))}
      </motion.div>

      {/* Social proof stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex items-center justify-center gap-4 mb-6 relative z-10"
      >
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          <span>
            <span className="text-foreground font-semibold">12,400+</span>{" "}
            learners
          </span>
        </div>
        <div className="w-px h-3 bg-white/[0.1]" />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Trophy className="w-3.5 h-3.5" />
          <span>
            Avg score: <span className="text-primary font-semibold">B1</span>
          </span>
        </div>
      </motion.div>

      {/* Glass CTA button with orange glow */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 150 }}
        className="w-full max-w-sm relative z-10"
      >
        <motion.button
          onClick={onStart}
          whileTap={{ scale: 0.98 }}
          whileHover={{
            boxShadow: "0 0 40px -10px rgba(232,120,77,0.5)",
          }}
          transition={springTransition}
          className="w-full py-4 rounded-full backdrop-blur-xl bg-white/[0.08] border border-white/[0.12] text-foreground font-semibold text-lg shadow-[0_0_30px_-10px_rgba(232,120,77,0.3)] hover:border-primary/40 transition-colors"
        >
          Start practising
        </motion.button>
        <p className="text-muted-foreground text-[11px] text-center mt-3">
          🔥 Today&apos;s challenge: Score higher than B1
        </p>
      </motion.div>

      {(topicHint || tutorDisplayName) ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.3 }}
          className="mt-5 w-full max-w-sm rounded-2xl border border-white/[0.1] bg-white/[0.05] p-3 text-center backdrop-blur-xl"
        >
          <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Assigned practice</p>
          <p className="mt-1 text-sm text-foreground">
            {tutorDisplayName ? `${tutorDisplayName} wants you to practise` : "Practice focus"}{" "}
            {topicHint ? <span className="text-primary">{topicHint}</span> : "today"}.
          </p>
        </motion.div>
      ) : null}

      <div className="w-full max-w-sm">
        <Leaderboard languageLabel={languageHint || "Spanish"} />
      </div>
    </div>
  );
}
