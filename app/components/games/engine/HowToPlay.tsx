"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HowToPlayStep {
  emoji: string;
  text: string;
}

interface HowToPlayContent {
  steps: HowToPlayStep[];
}

const GAME_CONTENT: Record<string, HowToPlayContent> = {
  connections: {
    steps: [
      { emoji: "🔍", text: "Tap 4 words that go together" },
      { emoji: "✅", text: "Hit Submit to check your guess" },
      { emoji: "🏆", text: "Find all 4 colour groups to win!" },
    ],
  },
  "word-ladder": {
    steps: [
      { emoji: "🔤", text: "Change ONE letter at a time" },
      { emoji: "🪜", text: "Get from the top word to the bottom" },
      { emoji: "⭐", text: "Fewer steps = better score!" },
    ],
  },
  "daily-decode": {
    steps: [
      { emoji: "🔐", text: "Each letter is disguised as another" },
      { emoji: "👆", text: "Tap a letter, then type the real one" },
      { emoji: "💡", text: "Use hints if you're stuck!" },
    ],
  },
  "odd-one-out": {
    steps: [
      { emoji: "👀", text: "Look at the 4 words" },
      { emoji: "🚫", text: "Tap the one that doesn't belong" },
      { emoji: "❤️", text: "Don't lose all 3 lives!" },
    ],
  },
  "missing-piece": {
    steps: [
      { emoji: "📝", text: "Read the sentence with a gap" },
      { emoji: "👆", text: "Pick the word that fits" },
      { emoji: "🎯", text: "Get as many right as you can!" },
    ],
  },
  "synonym-spiral": {
    steps: [
      { emoji: "📖", text: "You'll see a word with its meaning" },
      { emoji: "✍️", text: "Type a word that means the same thing" },
      { emoji: "🗼", text: "Climb higher with harder synonyms!" },
    ],
  },
};

const GAME_ICONS: Record<string, string> = {
  connections: "🔗",
  "word-ladder": "🪜",
  "daily-decode": "🔐",
  "odd-one-out": "🚫",
  "missing-piece": "🧩",
  "synonym-spiral": "🌀",
};

interface HowToPlayProps {
  gameSlug: string;
  gameName: string;
}

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

  const content = GAME_CONTENT[gameSlug];
  if (!content) return null;

  const icon = GAME_ICONS[gameSlug] || "🎮";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-5"
          style={{ background: "rgba(0, 0, 0, 0.7)" }}
          onClick={dismiss}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-[320px] rounded-3xl p-6"
            style={{
              background: "#FFFFFF",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.4)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Game icon + name */}
            <div className="flex flex-col items-center mb-5">
              <span className="text-4xl mb-2" role="img" aria-label={gameName}>
                {icon}
              </span>
              <h2
                className="text-lg font-extrabold tracking-tight"
                style={{ color: "#1a1a2e" }}
              >
                {gameName}
              </h2>
              <p
                className="text-xs mt-0.5 font-medium"
                style={{ color: "#8B8FA3" }}
              >
                How to play
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-4 mb-6">
              {content.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                    style={{
                      background: "#F4F4FF",
                    }}
                  >
                    {step.emoji}
                  </div>
                  <div className="flex-1 pt-2">
                    <p
                      className="text-sm font-semibold leading-snug"
                      style={{ color: "#2D2D3F" }}
                    >
                      {step.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Got it button */}
            <button
              onClick={dismiss}
              className="w-full py-3 rounded-2xl text-sm font-bold transition-transform active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #6C63FF 0%, #4F46E5 100%)",
                color: "#FFFFFF",
                boxShadow: "0 4px 14px rgba(79, 70, 229, 0.4)",
              }}
            >
              Got it! 👍
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
