"use client";

import { motion } from "framer-motion";
import { haptic } from "@/lib/games/haptics";
import { fireConfetti } from "@/lib/games/juice";
import { CONFETTI_SOLVE } from "@/lib/games/animations";
import * as React from "react";
import type {
  ConnectionCategory,
  Difficulty,
} from "@/lib/games/data/connections/types";
import { cn } from "@/lib/utils";

interface CategoryRevealProps {
  category: ConnectionCategory;
  index: number;
}

/** Gemini directive: solid category colours with glow + faux 3D */
const COLOUR_MAP: Record<
  Difficulty,
  { bg: string; border: string; text: string; glow: string; label: string }
> = {
  yellow: {
    bg: "#F9DF6D",
    border: "#D4B62C",
    text: "#1A1A1B",
    glow: "rgba(249, 223, 109, 0.15)",
    label: "🟨",
  },
  green: {
    bg: "#6AAA64",
    border: "#538D4E",
    text: "#FFFFFF",
    glow: "rgba(106, 170, 100, 0.15)",
    label: "🟩",
  },
  blue: {
    bg: "#85C0F9",
    border: "#5A9BD5",
    text: "#1A1A1B",
    glow: "rgba(133, 192, 249, 0.15)",
    label: "🟦",
  },
  purple: {
    bg: "#B484D6",
    border: "#8B5CB5",
    text: "#FFFFFF",
    glow: "rgba(180, 132, 214, 0.15)",
    label: "🟪",
  },
};

export default function CategoryReveal({
  category,
  index,
}: CategoryRevealProps) {
  const colours = COLOUR_MAP[category.difficulty];

  // Fire haptic + confetti on mount (category revealed)
  React.useEffect(() => {
    haptic("success");
    // Fire confetti with category-appropriate colour
    void fireConfetti({
      ...CONFETTI_SOLVE,
      colors: [colours.bg, colours.border, "#FFFFFF"],
      origin: { y: 0.4 + index * 0.1 },
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 350,
        damping: 22,
        delay: index * 0.05,
      }}
      className={cn("rounded-xl px-4 py-3.5 origin-top")}
      style={{
        background: colours.bg,
        borderBottom: `4px solid ${colours.border}`,
        boxShadow: `0 2px 8px ${colours.glow}, 0 2px 6px rgba(0,0,0,0.08)`,
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-base">{colours.label}</span>
        <h3
          className="text-sm font-extrabold uppercase tracking-wide"
          style={{ color: colours.text }}
        >
          {category.name}
        </h3>
      </div>
      <p
        className="mt-1.5 text-xs font-bold uppercase tracking-wider"
        style={{ color: colours.text, opacity: 0.6 }}
      >
        {category.words.join(" · ")}
      </p>
    </motion.div>
  );
}
