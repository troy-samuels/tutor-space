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
    bg: "#FDE047",
    border: "#EAB308",
    text: "#080C14",
    glow: "rgba(253, 224, 71, 0.3)",
    label: "🟨",
  },
  green: {
    bg: "#4ADE80",
    border: "#22C55E",
    text: "#080C14",
    glow: "rgba(74, 222, 128, 0.3)",
    label: "🟩",
  },
  blue: {
    bg: "#60A5FA",
    border: "#3B82F6",
    text: "#080C14",
    glow: "rgba(96, 165, 250, 0.3)",
    label: "🟦",
  },
  purple: {
    bg: "#C084FC",
    border: "#A855F7",
    text: "#080C14",
    glow: "rgba(192, 132, 252, 0.3)",
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
        boxShadow: `0 0 20px ${colours.glow}, 0 4px 12px rgba(0,0,0,0.2)`,
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
