"use client";

import * as React from "react";
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

function getStateStyles(state: OptionState): React.CSSProperties {
  switch (state) {
    case "correct":
      return {
        background: "rgba(62,86,65,0.12)",
        borderColor: "rgba(62,86,65,0.4)",
        color: "#3E5641",
      };
    case "wrong":
      return {
        background: "rgba(162,73,54,0.12)",
        borderColor: "rgba(162,73,54,0.4)",
        color: "#A24936",
      };
    case "disabled":
      return {
        background: "rgba(0,0,0,0.02)",
        borderColor: "rgba(0,0,0,0.05)",
        color: "#9C9590",
        opacity: 0.4,
      };
    default:
      return {
        background: "#FFFFFF",
        borderTop: "1px solid rgba(45,42,38,0.06)",
        borderLeft: "1px solid rgba(45,42,38,0.06)",
        borderRight: "1px solid rgba(45,42,38,0.06)",
        borderBottom: "3px solid rgba(45,42,38,0.12)",
        color: "#2D2A26",
        boxShadow: "0 2px 6px rgba(45,42,38,0.06)",
      };
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
      whileHover={!disabled && state === "default" ? { y: -2 } : undefined}
      whileTap={!disabled && state === "default" ? { scale: 0.96 } : undefined}
      style={getStateStyles(state)}
      className={cn(
        "flex min-h-[52px] h-14 w-full items-center justify-center rounded-xl px-3 font-semibold transition-colors",
        "select-none touch-manipulation",
        "disabled:cursor-not-allowed",
        getAdaptiveFontClass(text),
        state === "default" && "hover:brightness-95 active:brightness-90",
      )}
    >
      <span className="break-all leading-tight text-center">{text}</span>
    </motion.button>
  );
}
