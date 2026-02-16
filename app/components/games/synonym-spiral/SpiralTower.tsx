"use client";

import { motion, AnimatePresence } from "framer-motion";
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

const DEPTH_STYLES: Record<DepthLevel, { bg: string; border: string; text: string; size: string }> = {
  1: {
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/40",
    text: "text-emerald-300",
    size: "text-base",
  },
  2: {
    bg: "bg-cyan-500/15",
    border: "border-cyan-500/40",
    text: "text-cyan-300",
    size: "text-sm",
  },
  3: {
    bg: "bg-blue-500/15",
    border: "border-blue-500/40",
    text: "text-blue-300",
    size: "text-sm",
  },
  4: {
    bg: "bg-purple-500/15",
    border: "border-purple-500/40",
    text: "text-purple-300",
    size: "text-xs",
  },
  5: {
    bg: "bg-amber-500/15",
    border: "border-amber-500/40",
    text: "text-amber-300",
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
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 25,
                delay: idx === 0 ? 0 : 0,
              }}
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

      {/* Starter word at the bottom — always visible, biggest */}
      <div className="w-full rounded-xl border border-white/20 bg-white/[0.06] px-4 py-3 text-center">
        <p className="text-lg font-bold text-foreground">{starterWord}</p>
        <p className="text-[10px] text-muted-foreground">{starterTranslation}</p>
      </div>
    </div>
  );
}
