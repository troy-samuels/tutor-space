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

/** Category colours — warm, on-brand */
const COLOUR_MAP: Record<
  Difficulty,
  { bg: string; border: string; text: string; glow: string }
> = {
  yellow: {
    bg: "#E8D5A3",
    border: "#C4A843",
    text: "#2D2A26",
    glow: "rgba(212, 168, 67, 0.1)",
  },
  green: {
    bg: "#7BA882",
    border: "#3E5641",
    text: "#FFFFFF",
    glow: "rgba(62, 86, 65, 0.1)",
  },
  blue: {
    bg: "#93B8D7",
    border: "#5A8AB5",
    text: "#2D2A26",
    glow: "rgba(90, 138, 181, 0.1)",
  },
  purple: {
    bg: "#B89CD4",
    border: "#8B5CB5",
    text: "#FFFFFF",
    glow: "rgba(139, 92, 181, 0.1)",
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
      className="rounded-xl px-4 py-3 origin-top"
      style={{
        background: colours.bg,
        borderBottom: `3px solid ${colours.border}`,
      }}
    >
      <h3
        className="text-[13px] font-bold uppercase tracking-wide"
        style={{ color: colours.text }}
      >
        {category.name}
      </h3>
      <p
        className="mt-1 text-xs font-medium uppercase tracking-wider"
        style={{ color: colours.text, opacity: 0.6 }}
      >
        {category.words.join(" · ")}
      </p>
    </motion.div>
  );
}
