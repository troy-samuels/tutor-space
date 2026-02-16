"use client";

import { motion } from "framer-motion";
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

export default function OptionButton({
  text,
  state,
  onClick,
  disabled = false,
  index,
}: OptionButtonProps) {
  return (
    <motion.button
      onClick={onClick}
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
        "flex h-14 w-full items-center justify-center rounded-xl border px-4 text-base font-semibold transition-colors sm:h-16 sm:text-lg",
        "select-none touch-manipulation",
        "disabled:cursor-not-allowed",
        getStateStyles(state),
      )}
    >
      {text}
    </motion.button>
  );
}
