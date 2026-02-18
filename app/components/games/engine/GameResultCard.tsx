"use client";

/**
 * GameResultCard — shared end-of-game result card
 * Used by: OddOneOut, MissingPiece, WordLadder, DailyDecode, SynonymSpiral
 *
 * Eliminates 5x duplicated result card code across the game suite.
 */

import { motion } from "framer-motion";
import * as React from "react";

interface GameResultCardProps {
  /** Large emoji to display at top — conveys result at a glance */
  emoji: string;
  /** Primary heading — "Well done!" / "Solved!" */
  heading: string;
  /** Subtext — score, steps, depth etc. */
  subtext: string;
  /** Optional completion time in seconds */
  timeSeconds?: number;
  /** Optional extra content (emoji grids, round breakdowns) */
  children?: React.ReactNode;
}

export default function GameResultCard({
  emoji,
  heading,
  subtext,
  timeSeconds,
  children,
}: GameResultCardProps) {
  const mins = timeSeconds !== undefined ? Math.floor(timeSeconds / 60) : null;
  const secs = timeSeconds !== undefined ? timeSeconds % 60 : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.15 }}
      className="rounded-2xl p-6 text-center"
      aria-live="polite"
      style={{
        background: "#FFFFFF",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Hero emoji */}
      <div className="text-4xl leading-none select-none" aria-hidden>
        {emoji}
      </div>

      {/* Heading */}
      <h2
        className="mt-3 text-xl font-bold tracking-tight"
        style={{ color: "#2D2A26" }}
      >
        {heading}
      </h2>

      {/* Subtext */}
      <p className="mt-1 text-sm leading-relaxed tabular-nums" style={{ color: "#6B6560" }}>
        {subtext}
      </p>

      {/* Time */}
      {mins !== null && secs !== null && (
        <p
          className="mt-2 text-xs font-mono tabular-nums"
          style={{ color: "#9C9590" }}
        >
          {mins}:{String(secs).padStart(2, "0")}
        </p>
      )}

      {/* Extra content — emoji grids, breakdowns etc. */}
      {children && <div className="mt-4">{children}</div>}
    </motion.div>
  );
}
