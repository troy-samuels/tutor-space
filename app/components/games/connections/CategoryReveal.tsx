"use client";

import { motion } from "framer-motion";
import { SPRING } from "@/lib/games/springs";
import { haptic } from "@/lib/games/haptics";
import { fireConfetti } from "@/lib/games/juice";
import { CONFETTI_SOLVE } from "@/lib/games/animations";
import * as React from "react";
import type { ConnectionCategory } from "@/lib/games/data/connections/types";
import { DIFFICULTY_COLOURS } from "@/components/games/engine/colours";

interface CategoryRevealProps {
  category: ConnectionCategory;
  index: number;
}

export default function CategoryReveal({
  category,
  index,
}: CategoryRevealProps) {
  const colours = DIFFICULTY_COLOURS[category.difficulty];

  // Capture initial values so the mount effect has stable deps
  const initialRef = React.useRef({ colours, index });

  // Fire haptic + confetti on mount (category revealed)
  React.useEffect(() => {
    const { colours: c, index: i } = initialRef.current;
    haptic("success");
    // Fire confetti with category-appropriate colour
    void fireConfetti({
      ...CONFETTI_SOLVE,
      colors: [c.bg, c.border, "#FFFFFF"],
      origin: { y: 0.4 + i * 0.1 },
    });
  }, []); // safe: initialRef captures mount-time values

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        ...SPRING.standard,
        delay: index * 0.08,
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
