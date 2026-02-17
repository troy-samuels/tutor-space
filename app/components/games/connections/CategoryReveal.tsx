"use client";

import { motion } from "framer-motion";
import { haptic } from "@/lib/games/haptics";
import * as React from "react";
import type { ConnectionCategory, Difficulty } from "@/lib/games/data/connections/types";
import { cn } from "@/lib/utils";

interface CategoryRevealProps {
  category: ConnectionCategory;
  index: number;
}

/** Design Bible: solid category colour backgrounds with dark text for max contrast */
/** MEDIUM-2: Full solid category colours — no opacity modifier */
const COLOUR_MAP: Record<Difficulty, { bg: string; text: string; wordText: string; label: string }> = {
  yellow: {
    bg: "bg-[var(--game-yellow)]",
    text: "text-[#080C14]",
    wordText: "text-[#080C14]/70",
    label: "🟨",
  },
  green: {
    bg: "bg-[var(--game-green)]",
    text: "text-[#080C14]",
    wordText: "text-[#080C14]/70",
    label: "🟩",
  },
  blue: {
    bg: "bg-[var(--game-blue)]",
    text: "text-[#080C14]",
    wordText: "text-[#080C14]/70",
    label: "🟦",
  },
  purple: {
    bg: "bg-[var(--game-purple)]",
    text: "text-[#080C14]",
    wordText: "text-[#080C14]/70",
    label: "🟪",
  },
};

export default function CategoryReveal({ category, index }: CategoryRevealProps) {
  const colours = COLOUR_MAP[category.difficulty];

  // Fire haptic on mount (category revealed)
  React.useEffect(() => {
    haptic("success");
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 350,
        damping: 25,
        delay: index * 0.05,
      }}
      className={cn(
        "rounded-lg px-4 py-3 origin-top",
        colours.bg,
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">{colours.label}</span>
        <h3 className={cn("text-sm font-bold", colours.text)}>
          {category.name}
        </h3>
      </div>
      <p className={cn("mt-1 text-xs font-medium uppercase tracking-wide", colours.wordText)}>
        {category.words.join(" · ")}
      </p>
    </motion.div>
  );
}
