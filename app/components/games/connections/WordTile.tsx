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
    bg: "#FDE047",
    border: "#EAB308",
    text: "#080C14",
    glow: "rgba(253, 224, 71, 0.4)",
  },
  green: {
    bg: "#4ADE80",
    border: "#22C55E",
    text: "#080C14",
    glow: "rgba(74, 222, 128, 0.4)",
  },
  blue: {
    bg: "#60A5FA",
    border: "#3B82F6",
    text: "#080C14",
    glow: "rgba(96, 165, 250, 0.4)",
  },
  purple: {
    bg: "#C084FC",
    border: "#A855F7",
    text: "#080C14",
    glow: "rgba(192, 132, 252, 0.4)",
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

  /* ——— Inline styles for the "Supercell" tile look ——— */
  const tileStyle: React.CSSProperties = colours
    ? {
        // Correct / solved state — full category colour
        background: colours.bg,
        borderBottom: `4px solid ${colours.border}`,
        color: colours.text,
        boxShadow: `0 0 16px ${colours.glow}`,
      }
    : state === "selected"
      ? {
          // Selected — neon blue glow + pressed down
          background: "#3B82F6",
          borderBottom: "4px solid #1D4ED8",
          color: "#FFFFFF",
          transform: "translateY(2px)",
          boxShadow: "0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.2)",
        }
      : state === "wrong"
        ? {
            // Wrong — red flash
            background: "#F87171",
            borderBottom: "4px solid #DC2626",
            color: "#080C14",
          }
        : state === "false-friend"
          ? {
              // False friend — amber warning
              background: "#1E2740",
              borderBottom: "4px solid #FBBF24",
              color: "#F1F5F9",
            }
          : {
              // Default — chunky dark tile with faux-3D depth
              background: "#1E293B",
              borderBottom: "4px solid #0F172A",
              color: "#F1F5F9",
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
                background: "#1E2740",
                border: "2px solid #FBBF24",
              }}
            >
              <span className="text-lg mb-0.5">🪤</span>
              {falseFriendBack && (
                <span
                  className="text-[9px] leading-tight text-center px-1.5 font-semibold"
                  style={{ color: "#FBBF24" }}
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
