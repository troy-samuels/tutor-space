"use client";

import { motion } from "framer-motion";
import { haptic } from "@/lib/games/haptics";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/games/data/connections/types";

export type TileState =
  | "default"
  | "selected"
  | "correct-yellow"
  | "correct-green"
  | "correct-blue"
  | "correct-purple"
  | "wrong";

interface WordTileProps {
  word: string;
  state: TileState;
  onClick?: () => void;
  disabled?: boolean;
}

const DIFFICULTY_COLOURS: Record<Difficulty, { bg: string; border: string; text: string }> = {
  yellow: { bg: "bg-[#F9DF6D]/20", border: "border-[#F9DF6D]/50", text: "text-[#F9DF6D]" },
  green:  { bg: "bg-[#A0C35A]/20", border: "border-[#A0C35A]/50", text: "text-[#A0C35A]" },
  blue:   { bg: "bg-[#B0C4EF]/20", border: "border-[#B0C4EF]/50", text: "text-[#B0C4EF]" },
  purple: { bg: "bg-[#BA81C5]/20", border: "border-[#BA81C5]/50", text: "text-[#BA81C5]" },
};

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

const shakeAnimation = {
  x: [0, -6, 6, -6, 6, -3, 3, 0],
  transition: { duration: 0.5 },
};

function getStateStyles(state: TileState): string {
  switch (state) {
    case "selected":
      return "backdrop-blur-md bg-primary/[0.15] border-primary/40 text-primary shadow-[0_0_20px_-10px_rgba(232,120,77,0.4)]";
    case "correct-yellow":
      return `${DIFFICULTY_COLOURS.yellow.bg} ${DIFFICULTY_COLOURS.yellow.border} ${DIFFICULTY_COLOURS.yellow.text}`;
    case "correct-green":
      return `${DIFFICULTY_COLOURS.green.bg} ${DIFFICULTY_COLOURS.green.border} ${DIFFICULTY_COLOURS.green.text}`;
    case "correct-blue":
      return `${DIFFICULTY_COLOURS.blue.bg} ${DIFFICULTY_COLOURS.blue.border} ${DIFFICULTY_COLOURS.blue.text}`;
    case "correct-purple":
      return `${DIFFICULTY_COLOURS.purple.bg} ${DIFFICULTY_COLOURS.purple.border} ${DIFFICULTY_COLOURS.purple.text}`;
    case "wrong":
      return "backdrop-blur-md bg-destructive/[0.15] border-destructive/40 text-destructive";
    default:
      return "backdrop-blur-md bg-white/[0.04] border-white/[0.08] text-foreground hover:bg-white/[0.08]";
  }
}

/**
 * Dynamically scale font size based on word length.
 * Handles CJK characters, Arabic, and long European words gracefully.
 */
function getAdaptiveFontClass(word: string): string {
  const len = word.length;
  if (len <= 4) return "text-sm sm:text-base";
  if (len <= 8) return "text-xs sm:text-sm";
  if (len <= 12) return "text-[11px] sm:text-xs";
  return "text-[10px] sm:text-[11px]";
}

export default function WordTile({
  word,
  state,
  onClick,
  disabled = false,
}: WordTileProps) {
  const handleClick = () => {
    haptic("tap");
    onClick?.();
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      layout
      whileTap={!disabled ? { scale: 0.93 } : undefined}
      animate={state === "wrong" ? shakeAnimation : { scale: state === "selected" ? 1.03 : 1 }}
      transition={springTransition}
      className={cn(
        "flex min-h-[48px] h-14 w-full items-center justify-center rounded-xl border px-2 font-semibold transition-colors sm:h-16",
        "select-none touch-manipulation",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        getAdaptiveFontClass(word),
        getStateStyles(state),
      )}
    >
      <span className="break-all leading-tight text-center">{word}</span>
    </motion.button>
  );
}

export { DIFFICULTY_COLOURS };
