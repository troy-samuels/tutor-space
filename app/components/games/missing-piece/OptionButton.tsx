"use client";

import { motion } from "framer-motion";
import { haptic } from "@/lib/games/haptics";
import { cn } from "@/lib/utils";

export type OptionState = "default" | "correct" | "wrong" | "disabled";

interface OptionButtonProps {
  text: string;
  state: OptionState;
  onClick?: () => void;
  disabled?: boolean;
  index: number;
}

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

const shakeAnimation = {
  x: [0, -6, 6, -6, 6, -3, 3, 0],
  transition: { duration: 0.5 },
};

function getStateStyles(state: OptionState): string {
  switch (state) {
    case "correct":
      return "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_-10px_rgba(16,185,129,0.4)]";
    case "wrong":
      return "bg-destructive/[0.15] border-destructive/40 text-destructive";
    case "disabled":
      return "bg-white/[0.02] border-white/[0.05] text-muted-foreground opacity-40";
    default:
      return "bg-white/[0.04] border-white/[0.08] text-foreground hover:bg-white/[0.08] active:bg-primary/[0.15] active:border-primary/40";
  }
}

/**
 * Dynamically scale font size based on text length.
 * Handles CJK, Arabic, agglutinative words gracefully.
 */
function getAdaptiveFontClass(text: string): string {
  const len = text.length;
  if (len <= 8) return "text-base sm:text-lg";
  if (len <= 14) return "text-sm sm:text-base";
  if (len <= 20) return "text-xs sm:text-sm";
  return "text-[11px] sm:text-xs";
}

export default function OptionButton({
  text,
  state,
  onClick,
  disabled = false,
  index,
}: OptionButtonProps) {
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
      initial={{ opacity: 0, y: 10 }}
      animate={
        state === "wrong"
          ? { ...shakeAnimation, opacity: 1, y: 0 }
          : state === "correct"
            ? { scale: [1, 1.05, 1], opacity: 1, y: 0 }
            : { opacity: 1, y: 0 }
      }
      transition={{
        ...springTransition,
        delay: index * 0.05,
      }}
      whileTap={!disabled && state === "default" ? { scale: 0.96 } : undefined}
      className={cn(
        "flex min-h-[48px] h-14 w-full items-center justify-center rounded-xl border px-4 font-semibold transition-colors sm:h-16",
        "select-none touch-manipulation",
        "disabled:cursor-not-allowed",
        getAdaptiveFontClass(text),
        getStateStyles(state),
      )}
    >
      <span className="break-all leading-tight text-center">{text}</span>
    </motion.button>
  );
}
