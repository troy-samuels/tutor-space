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

const COLOUR_MAP: Record<Difficulty, { bg: string; border: string; text: string; label: string; solidBg: string }> = {
  yellow: { bg: "bg-[#F9DF6D]/15", border: "border-[#F9DF6D]/30", text: "text-[#F9DF6D]", label: "🟨", solidBg: "bg-[#F9DF6D]/25" },
  green:  { bg: "bg-[#A0C35A]/15", border: "border-[#A0C35A]/30", text: "text-[#A0C35A]", label: "🟩", solidBg: "bg-[#A0C35A]/25" },
  blue:   { bg: "bg-[#B0C4EF]/15", border: "border-[#B0C4EF]/30", text: "text-[#B0C4EF]", label: "🟦", solidBg: "bg-[#B0C4EF]/25" },
  purple: { bg: "bg-[#BA81C5]/15", border: "border-[#BA81C5]/30", text: "text-[#BA81C5]", label: "🟪", solidBg: "bg-[#BA81C5]/25" },
};

export default function CategoryReveal({ category, index }: CategoryRevealProps) {
  const colours = COLOUR_MAP[category.difficulty];

  // Fire haptic on mount (category revealed)
  React.useEffect(() => {
    haptic("success");
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0.3, y: -10 }}
      animate={{ opacity: 1, scaleY: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 350,
        damping: 25,
        delay: index * 0.05,
      }}
      className={cn(
        "rounded-xl border px-4 py-3 origin-top",
        colours.solidBg,
        colours.border,
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">{colours.label}</span>
        <h3 className={cn("text-sm font-bold", colours.text)}>
          {category.name}
        </h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {category.words.join(" · ")}
      </p>
    </motion.div>
  );
}
