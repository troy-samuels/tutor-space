"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  currentRound: number;
  totalRounds: number;
  lives: number;
  maxLives: number;
}

export default function ProgressBar({
  currentRound,
  totalRounds,
  lives,
  maxLives,
}: ProgressBarProps) {
  const progress = (currentRound / totalRounds) * 100;

  // Progress bar fill colour: green → orange → rust as lives decrease
  const barColour =
    lives === maxLives
      ? "#3E5641" // sage green (full health)
      : lives >= 2
        ? "#D36135" // brand orange (caution)
        : "#A24936"; // rust (danger)

  return (
    <div className="space-y-2">
      {/* Round counter + Lives */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "#6B6560" }}>
          Round {Math.min(currentRound + 1, totalRounds)}/{totalRounds}
        </span>
        <div className="flex items-center gap-1">
          {Array.from({ length: maxLives }).map((_, i) => (
            <motion.span
              key={i}
              initial={false}
              animate={{
                scale: i >= lives ? 0.8 : 1,
                opacity: i >= lives ? 0.3 : 1,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="text-sm select-none"
              style={{ color: i < lives ? "#3E5641" : "#9C9590" }}
            >
              {i < lives ? "●" : "○"}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Progress bar — visible track on cream background */}
      <div
        className="h-2 w-full overflow-hidden rounded-full"
        style={{ background: "rgba(45,42,38,0.10)" }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
          className="h-full rounded-full transition-colors"
          style={{ background: barColour }}
        />
      </div>
    </div>
  );
}
