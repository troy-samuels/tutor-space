"use client";

import { motion, AnimatePresence } from "framer-motion";
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
  | "wrong"
  | "false-friend";

interface WordTileProps {
  word: string;
  state: TileState;
  onClick?: () => void;
  disabled?: boolean;
  /** For false-friend flip: the real meaning text (e.g. "ACTUAL = current ≠ actual") */
  falseFriendBack?: string;
}

/** Design Bible colours — solid category fills for correct states */
const DIFFICULTY_COLOURS: Record<Difficulty, { bg: string; border: string; text: string }> = {
  yellow: { bg: "bg-[var(--game-yellow)]", border: "border-[var(--game-yellow)]", text: "text-[#080C14]" },
  green:  { bg: "bg-[var(--game-green)]",  border: "border-[var(--game-green)]",  text: "text-[#080C14]" },
  blue:   { bg: "bg-[var(--game-blue)]",   border: "border-[var(--game-blue)]",   text: "text-[#080C14]" },
  purple: { bg: "bg-[var(--game-purple)]",  border: "border-[var(--game-purple)]",  text: "text-[#080C14]" },
};

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

const shakeAnimation = {
  x: [0, -8, 8, -4, 4, 0],
  transition: { duration: 0.4 },
};

function getStateStyles(state: TileState): string {
  switch (state) {
    case "selected":
      return [
        "bg-[var(--game-bg-active)]",
        "border-[var(--game-text-accent)]",
        "border-2",
        "text-[var(--game-text-primary)]",
        "shadow-[0_0_16px_-4px_rgba(252,211,77,0.25)]",
      ].join(" ");
    case "correct-yellow":
      return `${DIFFICULTY_COLOURS.yellow.bg} ${DIFFICULTY_COLOURS.yellow.border} ${DIFFICULTY_COLOURS.yellow.text}`;
    case "correct-green":
      return `${DIFFICULTY_COLOURS.green.bg} ${DIFFICULTY_COLOURS.green.border} ${DIFFICULTY_COLOURS.green.text}`;
    case "correct-blue":
      return `${DIFFICULTY_COLOURS.blue.bg} ${DIFFICULTY_COLOURS.blue.border} ${DIFFICULTY_COLOURS.blue.text}`;
    case "correct-purple":
      return `${DIFFICULTY_COLOURS.purple.bg} ${DIFFICULTY_COLOURS.purple.border} ${DIFFICULTY_COLOURS.purple.text}`;
    case "wrong":
      return [
        "bg-[var(--game-wrong)]",
        "border-[var(--game-wrong)]",
        "text-[#080C14]",
      ].join(" ");
    case "false-friend":
      return [
        "bg-[var(--game-bg-surface)]",
        "border-[var(--game-warning)]",
        "border-2",
        "text-[var(--game-text-primary)]",
      ].join(" ");
    default:
      return [
        "bg-[var(--game-bg-surface)]",
        "border-[rgba(255,255,255,0.06)]",
        "text-[var(--game-text-primary)]",
        "hover:bg-[var(--game-bg-elevated)]",
      ].join(" ");
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
  falseFriendBack,
}: WordTileProps) {
  const handleClick = () => {
    haptic("tap");
    onClick?.();
  };

  // HIGH-3: Selected uses spring keyframe sequence instead of static scale
  const getAnimateProps = () => {
    if (state === "wrong") return shakeAnimation;
    if (state === "selected") {
      return {
        scale: [1, 0.95, 1.02, 1],
        transition: { duration: 0.2, ease: [0.7, 0, 0.3, 1] as [number, number, number, number] },
      };
    }
    if (state === "false-friend") {
      return {
        rotateY: [0, 180, 360],
        transition: { duration: 0.8, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] },
      };
    }
    return { scale: 1 };
  };

  return (
    <div style={{ perspective: "600px" }}>
      <motion.button
        onClick={handleClick}
        disabled={disabled}
        layout
        whileTap={!disabled ? { scale: 0.95 } : undefined}
        animate={getAnimateProps()}
        transition={springTransition}
        aria-pressed={state === "selected"}
        role="gridcell"
        className={cn(
          "relative flex min-h-[50px] h-[3.25rem] w-full items-center justify-center",
          "rounded-lg border px-1.5",
          "font-bold uppercase tracking-wide",
          "select-none touch-manipulation",
          "transition-colors duration-150",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          getAdaptiveFontClass(word),
          getStateStyles(state),
        )}
      >
        {/* Front face — always visible */}
        <span className="break-all leading-tight text-center">{word}</span>

        {/* False Friend overlay — shows trap icon + meaning on back */}
        <AnimatePresence>
          {state === "false-friend" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-[var(--game-bg-elevated)] border-2 border-[var(--game-warning)]"
            >
              <span className="text-lg mb-0.5">🪤</span>
              {falseFriendBack && (
                <span className="text-[9px] leading-tight text-center px-1 text-[var(--game-warning)]">
                  {falseFriendBack}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

export { DIFFICULTY_COLOURS };
