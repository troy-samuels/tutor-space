"use client";

import { motion } from "framer-motion";
import { haptic } from "@/lib/games/haptics";
import { cn } from "@/lib/utils";

export type CardState = "default" | "correct" | "wrong" | "revealed";

interface WordCardProps {
  word: string;
  state: CardState;
  onClick?: () => void;
  disabled?: boolean;
}

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

const shakeAnimation = {
  x: [0, -8, 8, -8, 8, -4, 4, 0],
  transition: { duration: 0.5 },
};

function getStateStyles(state: CardState): string {
  switch (state) {
    case "correct":
      return "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_-10px_rgba(16,185,129,0.4)]";
    case "wrong":
      return "bg-destructive/[0.15] border-destructive/40 text-destructive";
    case "revealed":
      return "bg-white/[0.06] border-white/[0.12] text-muted-foreground opacity-60";
    default:
      return "bg-white/[0.04] border-white/[0.08] text-foreground hover:bg-white/[0.08] active:bg-white/[0.12]";
  }
}

/**
 * Dynamically scale font size based on word length.
 * Handles CJK, Arabic, and long European words gracefully.
 */
function getAdaptiveFontClass(word: string): string {
  const len = word.length;
  if (len <= 5) return "text-lg sm:text-xl";
  if (len <= 10) return "text-base sm:text-lg";
  if (len <= 15) return "text-sm sm:text-base";
  return "text-xs sm:text-sm";
}

export default function WordCard({
  word,
  state,
  onClick,
  disabled = false,
}: WordCardProps) {
  const handleClick = () => {
    if (state === "default") {
      haptic("tap");
    }
    onClick?.();
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || state !== "default"}
      whileTap={!disabled && state === "default" ? { scale: 0.93 } : undefined}
      animate={
        state === "wrong"
          ? shakeAnimation
          : state === "correct"
            ? { scale: [1, 1.05, 1] }
            : { scale: 1 }
      }
      transition={springTransition}
      className={cn(
        "flex min-h-[56px] h-20 w-full items-center justify-center rounded-2xl border px-3 font-bold transition-colors",
        "select-none touch-manipulation",
        "disabled:cursor-not-allowed",
        getAdaptiveFontClass(word),
        getStateStyles(state),
      )}
    >
      <span className="break-all leading-tight text-center">{word}</span>
    </motion.button>
  );
}
