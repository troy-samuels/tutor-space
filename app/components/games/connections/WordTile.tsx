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
  /** For false-friend flip: the real meaning text */
  falseFriendBack?: string;
}

/** Difficulty colours — Gemini directive: category fills */
const DIFFICULTY_COLOURS: Record<
  Difficulty,
  { bg: string; border: string; text: string; glow: string }
> = {
  yellow: {
    bg: "#F9DF6D",
    border: "#D4B62C",
    text: "#1A1A1B",
    glow: "rgba(249, 223, 109, 0.2)",
  },
  green: {
    bg: "#6AAA64",
    border: "#538D4E",
    text: "#FFFFFF",
    glow: "rgba(106, 170, 100, 0.2)",
  },
  blue: {
    bg: "#85C0F9",
    border: "#5A9BD5",
    text: "#1A1A1B",
    glow: "rgba(133, 192, 249, 0.2)",
  },
  purple: {
    bg: "#B484D6",
    border: "#8B5CB5",
    text: "#FFFFFF",
    glow: "rgba(180, 132, 214, 0.2)",
  },
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

function getDifficultyFromState(
  state: TileState,
): Difficulty | null {
  if (state === "correct-yellow") return "yellow";
  if (state === "correct-green") return "green";
  if (state === "correct-blue") return "blue";
  if (state === "correct-purple") return "purple";
  return null;
}

/**
 * Dynamically scale font size based on word length.
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

  const difficulty = getDifficultyFromState(state);
  const colours = difficulty ? DIFFICULTY_COLOURS[difficulty] : null;

  const getAnimateProps = () => {
    if (state === "wrong") return shakeAnimation;
    if (state === "selected") {
      return {
        scale: [1, 0.95, 1.02, 1],
        transition: {
          duration: 0.2,
          ease: [0.7, 0, 0.3, 1] as [number, number, number, number],
        },
      };
    }
    if (state === "false-friend") {
      return {
        rotateY: [0, 180, 360],
        transition: {
          duration: 0.8,
          ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
        },
      };
    }
    return { scale: 1 };
  };

  /* ——— Inline styles for the NYT-inspired tile look ——— */
  const tileStyle: React.CSSProperties = colours
    ? {
        // Correct / solved state — full category colour
        background: colours.bg,
        borderBottom: `4px solid ${colours.border}`,
        color: colours.text,
        boxShadow: `0 2px 8px rgba(0,0,0,0.1)`,
      }
    : state === "selected"
      ? {
          // Selected — dark fill with white text (NYT style)
          background: "#5A5A5C",
          borderBottom: "4px solid #3A3A3C",
          color: "#FFFFFF",
          transform: "translateY(1px)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }
      : state === "wrong"
        ? {
            // Wrong — red flash
            background: "#DC3545",
            borderBottom: "4px solid #B02A37",
            color: "#FFFFFF",
          }
        : state === "false-friend"
          ? {
              // False friend — amber warning on light
              background: "#FEF3C7",
              borderBottom: "4px solid #C9B458",
              color: "#1A1A1B",
            }
          : {
              // Default — clean white tile with subtle border + shadow
              background: "#EFEFE6",
              borderBottom: "4px solid #DEDAD2",
              color: "#1A1A1B",
            };

  return (
    <div style={{ perspective: "600px" }}>
      <motion.button
        onClick={handleClick}
        disabled={disabled}
        layout
        whileTap={!disabled ? { scale: 0.93 } : undefined}
        animate={getAnimateProps()}
        transition={springTransition}
        aria-pressed={state === "selected"}
        role="gridcell"
        className={cn(
          "relative flex min-h-[56px] h-[3.5rem] w-full items-center justify-center",
          "rounded-xl px-2",
          "font-bold uppercase tracking-wide",
          "select-none touch-manipulation",
          "transition-all duration-100",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "active:brightness-90",
          getAdaptiveFontClass(word),
        )}
        style={{
          fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
          ...tileStyle,
        }}
      >
        {/* Front face */}
        <span className="break-all leading-tight text-center">{word}</span>

        {/* False Friend overlay — trap icon + meaning on back */}
        <AnimatePresence>
          {state === "false-friend" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center rounded-xl"
              style={{
                background: "#FEF3C7",
                border: "2px solid #C9B458",
              }}
            >
              <span className="text-lg mb-0.5">🪤</span>
              {falseFriendBack && (
                <span
                  className="text-[9px] leading-tight text-center px-1.5 font-semibold"
                  style={{ color: "#92710C" }}
                >
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
