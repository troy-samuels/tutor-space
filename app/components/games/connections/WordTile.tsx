"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SPRING } from "@/lib/games/springs";
import { haptic } from "@/lib/games/haptics";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/games/data/connections/types";
import { DIFFICULTY_COLOURS } from "@/components/games/engine/colours";

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

const springTransition = SPRING.snappy;

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
 * Dynamically scale font size based on word/phrase length.
 * Multi-word phrases get smaller text to prevent overflow.
 */
function getAdaptiveFontClass(word: string): string {
  const len = word.length;
  const isMultiWord = word.includes(" ");
  if (isMultiWord) {
    if (len <= 8) return "text-xs sm:text-sm";
    if (len <= 12) return "text-[11px] sm:text-xs";
    return "text-[9px] sm:text-[10px]";
  }
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

  /* ——— Tile styles — TutorLingua brand palette ——— */
  const tileStyle: React.CSSProperties = colours
    ? {
        // Correct / solved — category colour
        background: colours.bg,
        borderBottom: `3px solid ${colours.border}`,
        color: colours.text,
        boxShadow: `0 1px 4px rgba(45,42,38,0.08)`,
      }
    : state === "selected"
      ? {
          // Selected — brand dark
          background: "#2D2A26",
          borderBottom: "3px solid #1A1917",
          color: "#FFFFFF",
          boxShadow: "0 2px 8px rgba(45,42,38,0.2)",
        }
      : state === "wrong"
        ? {
            // Wrong — brand rust
            background: "#A24936",
            borderBottom: "3px solid #8A3D2E",
            color: "#FFFFFF",
          }
        : state === "false-friend"
          ? {
              // False friend — warm amber
              background: "#FDF3E3",
              borderBottom: "3px solid #D4A843",
              color: "#2D2A26",
            }
          : {
              // Default — warm cream
              background: "#F5EDE8",
              borderBottom: "3px solid #E8DDD6",
              color: "#2D2A26",
            };

  return (
    <div style={{ perspective: "600px" }}>
      <motion.button
        onClick={handleClick}
        disabled={disabled}
        layout
        whileHover={!disabled ? { y: -2 } : undefined}
        whileTap={!disabled ? { scale: 0.96 } : undefined}
        animate={getAnimateProps()}
        transition={springTransition}
        aria-pressed={state === "selected"}
        role="gridcell"
        className={cn(
          "relative flex min-h-[56px] w-full items-center justify-center",
          "rounded-lg px-2",
          "font-semibold uppercase tracking-wide",
          "select-none touch-manipulation cursor-pointer",
          "transition-all duration-100",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "active:brightness-90",
          getAdaptiveFontClass(word),
        )}
        style={tileStyle}
      >
        {/* Front face */}
        <span className="break-words leading-tight text-center hyphens-auto">{word}</span>

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

export { DIFFICULTY_COLOURS } from "@/components/games/engine/colours";
