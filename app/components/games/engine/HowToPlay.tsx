"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SPRING } from "@/lib/games/springs";

interface HowToPlayProps {
  gameSlug: string;
  gameName: string;
  /** Optional callback when the tutorial is dismissed — use to start timer */
  onDismiss?: () => void;
}

/** Short, punchy one-liner per game + a single key tip */
const GAME_TIPS: Record<string, { goal: string; tip: string }> = {
  connections: {
    goal: "Find 4 groups of 4 connected words",
    tip: "Tap 4 words, then hit Submit",
  },
  "word-ladder": {
    goal: "Change one letter at a time to reach the target",
    tip: "Each step must be a real word",
  },
  "daily-decode": {
    goal: "Crack the cipher to reveal the hidden quote",
    tip: "Tap a letter, type the real one",
  },
  "odd-one-out": {
    goal: "Spot the word that doesn't belong",
    tip: "3 share a connection — 1 doesn't",
  },
  "missing-piece": {
    goal: "Fill in the blank with the right word",
    tip: "Read the sentence, pick the best fit",
  },
  "synonym-spiral": {
    goal: "Climb from basic to literary synonyms",
    tip: "Type a synonym at each level",
  },
  "neon-intercept": {
    goal: "Tap the matching lane before words land",
    tip: "Watch for False Friends — they look right but aren't",
  },
};

export default function HowToPlay({ gameSlug, gameName, onDismiss }: HowToPlayProps) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const key = `howToPlay_${gameSlug}_seen`;
    if (typeof window !== "undefined" && !localStorage.getItem(key)) {
      setVisible(true);
    }
  }, [gameSlug]);

  const dismiss = React.useCallback(() => {
    const key = `howToPlay_${gameSlug}_seen`;
    localStorage.setItem(key, "1");
    setVisible(false);
    onDismiss?.();
  }, [gameSlug, onDismiss]);

  // Auto-dismiss after 6 seconds if user doesn't interact
  React.useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(dismiss, 6000);
    return () => clearTimeout(timer);
  }, [visible, dismiss]);

  // Dismiss on Escape key
  React.useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, dismiss]);

  const tip = GAME_TIPS[gameSlug];
  if (!tip) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={SPRING.snappy}
          className="mb-3 rounded-xl px-4 py-3 cursor-pointer touch-manipulation"
          style={{
            background: "rgba(45, 42, 38, 0.04)",
            border: "1px solid rgba(45, 42, 38, 0.08)",
          }}
          onClick={dismiss}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
              style={{ background: "rgba(211, 97, 53, 0.1)" }}
            >
              <span className="text-sm">💡</span>
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-[13px] font-semibold leading-tight"
                style={{ color: "#2D2A26" }}
              >
                {tip.goal}
              </p>
              <p
                className="text-[12px] mt-0.5 leading-snug"
                style={{ color: "#9C9590" }}
              >
                {tip.tip}
              </p>
            </div>
            <span
              className="flex-shrink-0 text-[11px] font-medium mt-0.5"
              style={{ color: "#C5BFBA" }}
            >
              tap to dismiss
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
