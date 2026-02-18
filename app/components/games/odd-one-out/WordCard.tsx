"use client";

import * as React from "react";
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
  stiffness: 380,
  damping: 28,
};

const shakeAnimation = {
  x: [0, -10, 10, -8, 8, -4, 4, 0] as number[],
  transition: { duration: 0.45 },
};

const correctAnimation = {
  scale: [1, 1.06, 0.97, 1.02, 1] as number[],
  transition: { duration: 0.4 },
};

/** Card surface styles based on state */
function getCardStyle(state: CardState): React.CSSProperties {
  switch (state) {
    case "correct":
      return {
        background: "rgba(62,86,65,0.12)",
        border: "2px solid rgba(62,86,65,0.45)",
        color: "#3E5641",
        boxShadow: "0 4px 16px rgba(62,86,65,0.15)",
      };
    case "wrong":
      return {
        background: "rgba(162,73,54,0.12)",
        border: "2px solid rgba(162,73,54,0.45)",
        color: "#A24936",
        boxShadow: "0 2px 8px rgba(162,73,54,0.12)",
      };
    case "revealed":
      return {
        background: "rgba(0,0,0,0.03)",
        border: "2px solid rgba(0,0,0,0.06)",
        color: "#9C9590",
        opacity: 0.55,
      };
    default:
      return {
        background: "#FFFFFF",
        border: "1px solid rgba(45,42,38,0.10)",
        borderBottom: "3px solid rgba(45,42,38,0.12)",
        color: "#2D2A26",
        boxShadow: "0 2px 8px rgba(45,42,38,0.08)",
      };
  }
}

/**
 * Adaptive font — handles long European compound words and short CJK chars.
 */
function getAdaptiveFontClass(word: string): string {
  const len = word.length;
  if (len <= 5) return "text-xl sm:text-2xl";
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
    if (state === "default") haptic("tap");
    onClick?.();
  };

  const isInteractive = !disabled && state === "default";

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || state !== "default"}
      whileTap={isInteractive ? { scale: 0.96 } : undefined}
      animate={
        state === "wrong"
          ? shakeAnimation
          : state === "correct"
            ? correctAnimation
            : { scale: 1, opacity: 1 }
      }
      transition={springTransition}
      className={cn(
        "flex min-h-[72px] w-full items-center justify-center rounded-2xl px-3",
        "font-bold select-none touch-manipulation",
        "disabled:cursor-not-allowed",
        isInteractive && "active:brightness-95",
        getAdaptiveFontClass(word),
      )}
      style={getCardStyle(state)}
      aria-pressed={state === "correct" || state === "wrong"}
    >
      <span className="break-words text-center leading-tight">{word}</span>
    </motion.button>
  );
}
