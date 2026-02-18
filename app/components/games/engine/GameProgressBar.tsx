"use client";

/**
 * GameProgressBar — shared progress bar + lives header
 * Used by: OddOneOut, MissingPiece
 *
 * Standardised game progress header: label | lives | progress bar
 */

import { motion } from "framer-motion";
import { SPRING } from "@/lib/games/springs";
import GameLives from "./GameLives";

interface GameProgressBarProps {
  /** e.g. "Round 3/10" or "Sentence 5/15" */
  label: string;
  /** Current progress 0–1 */
  progress: number;
  lives: number;
  maxLives: number;
}

export default function GameProgressBar({
  label,
  progress,
  lives,
  maxLives,
}: GameProgressBarProps) {
  // Fill colour: green (full) → orange (caution) → rust (danger)
  const fillColour =
    lives === maxLives
      ? "#3E5641"  // sage green — full health
      : lives >= 2
        ? "#D36135" // brand orange — caution
        : "#A24936"; // rust — danger

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tabular-nums" style={{ color: "#6B6560" }}>
          {label}
        </span>
        <GameLives lives={lives} maxLives={maxLives} />
      </div>

      {/* Track */}
      <div
        className="h-2 w-full overflow-hidden rounded-full"
        style={{ background: "rgba(45,42,38,0.10)" }}
        role="progressbar"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={SPRING.gentle}
          className="h-full rounded-full"
          style={{ background: fillColour }}
        />
      </div>
    </div>
  );
}
