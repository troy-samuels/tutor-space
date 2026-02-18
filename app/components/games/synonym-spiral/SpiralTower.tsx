"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SPRING } from "@/lib/games/springs";
import { cn } from "@/lib/utils";
import type { DepthLevel } from "@/lib/games/data/synonym-spiral/types";

interface TowerWord {
  word: string;
  depth: DepthLevel;
}

interface SpiralTowerProps {
  starterWord: string;
  starterTranslation: string;
  words: TowerWord[];
}

// Light-theme depth styles — darker text/border so readable on cream bg
const DEPTH_STYLES: Record<DepthLevel, { bg: string; border: string; text: string; size: string }> = {
  1: {
    bg: "bg-emerald-100",
    border: "border-emerald-300",
    text: "text-emerald-700",
    size: "text-base",
  },
  2: {
    bg: "bg-sky-100",
    border: "border-sky-300",
    text: "text-sky-700",
    size: "text-sm",
  },
  3: {
    bg: "bg-indigo-100",
    border: "border-indigo-300",
    text: "text-indigo-700",
    size: "text-sm",
  },
  4: {
    bg: "bg-purple-100",
    border: "border-purple-300",
    text: "text-purple-700",
    size: "text-xs",
  },
  5: {
    bg: "bg-amber-100",
    border: "border-amber-300",
    text: "text-amber-700",
    size: "text-xs",
  },
};

export default function SpiralTower({
  starterWord,
  starterTranslation,
  words,
}: SpiralTowerProps) {
  // Render reversed (newest on top, starter at bottom)
  const reversedWords = [...words].reverse();

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Stacked words (newest at top, gets smaller + deeper colour) */}
      <AnimatePresence mode="popLayout">
        {reversedWords.map((entry, idx) => {
          const style = DEPTH_STYLES[entry.depth];
          // Width narrows as depth increases
          const widthPercent = Math.max(55, 100 - (entry.depth - 1) * 10);

          return (
            <motion.div
              key={`${entry.word}-${entry.depth}`}
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={SPRING.standard}
              style={{ width: `${widthPercent}%` }}
              className={cn(
                "rounded-xl border px-3 py-2 text-center font-semibold",
                style.bg,
                style.border,
                style.text,
                style.size,
              )}
            >
              {entry.word}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Starter word at the bottom — brand surface card */}
      <div
        className="w-full rounded-xl border px-4 py-3 text-center"
        style={{
          background: "#FFFFFF",
          borderColor: "rgba(0,0,0,0.10)",
        }}
      >
        <p className="text-lg font-bold" style={{ color: "#2D2A26" }}>
          {starterWord}
        </p>
        <p className="text-[10px]" style={{ color: "#9C9590" }}>
          {starterTranslation}
        </p>
      </div>
    </div>
  );
}
