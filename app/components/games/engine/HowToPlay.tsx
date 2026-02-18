"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HowToPlayProps {
  gameSlug: string;
  gameName: string;
}

const GAME_STEPS: Record<string, string[]> = {
  connections: [
    "Tap 4 words that share a hidden connection",
    "Hit Submit to check your guess",
    "Find all 4 groups to win",
  ],
  "word-ladder": [
    "Change one letter at a time",
    "Each step must be a real word",
    "Reach the target in as few steps as possible",
  ],
  "daily-decode": [
    "Each letter has been swapped for another",
    "Tap a letter, then type the real one",
    "Decode the full quote to win",
  ],
  "odd-one-out": [
    "Four words — three share a connection",
    "Tap the one that doesn't belong",
    "You have 3 lives",
  ],
  "missing-piece": [
    "Read the sentence with a gap",
    "Pick the word that fits",
    "Get as many right as you can",
  ],
  "synonym-spiral": [
    "You'll see a word and its meaning",
    "Type a synonym at each level",
    "Climb from basic to literary",
  ],
};

export default function HowToPlay({ gameSlug, gameName }: HowToPlayProps) {
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
  }, [gameSlug]);

  const steps = GAME_STEPS[gameSlug];
  if (!steps) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-6"
          style={{ background: "rgba(45, 42, 38, 0.5)" }}
          onClick={dismiss}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="w-full max-w-[300px] rounded-2xl p-6"
            style={{
              background: "#FFFFFF",
              boxShadow: "0 16px 48px rgba(45, 42, 38, 0.16)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="text-base font-bold tracking-tight mb-1"
              style={{ color: "#2D2A26", fontFamily: "var(--font-manrope), sans-serif" }}
            >
              {gameName}
            </h2>
            <p
              className="text-xs mb-5"
              style={{ color: "#9C9590" }}
            >
              How to play
            </p>

            <ol className="space-y-3 mb-6">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5"
                    style={{
                      background: "#F5EDE8",
                      color: "#6B6560",
                    }}
                  >
                    {i + 1}
                  </span>
                  <p
                    className="text-[13px] leading-relaxed"
                    style={{ color: "#2D2A26" }}
                  >
                    {step}
                  </p>
                </li>
              ))}
            </ol>

            <motion.button
              onClick={dismiss}
              whileTap={{ scale: 0.96 }}
              className="w-full min-h-[48px] rounded-xl text-sm font-semibold touch-manipulation select-none"
              style={{
                background: "#D36135",
                color: "#FFFFFF",
              }}
            >
              Got it
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
