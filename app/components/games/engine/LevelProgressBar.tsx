"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { CEFR_LEVELS, type CefrLevel } from "@/lib/games/cefr";

interface LevelProgressBarProps {
  level: CefrLevel;
  correct: number;
  total: number;
  /** Current question index (0-based) */
  currentIndex?: number;
}

function LevelProgressBar({
  level,
  correct,
  total,
  currentIndex,
}: LevelProgressBarProps) {
  const config = CEFR_LEVELS[level];
  const progress = currentIndex !== undefined && total > 0
    ? ((currentIndex + 1) / total) * 100
    : total > 0
      ? (correct / total) * 100
      : 0;

  return (
    <div className="flex items-center gap-3 w-full">
      {/* Level badge */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
        style={{ background: config.colour }}
      >
        {level}
      </div>

      {/* Progress track */}
      <div className="flex-1">
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ background: "rgba(45, 42, 38, 0.08)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: config.colour }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, progress)}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      {/* Score */}
      <span
        className="flex-shrink-0 text-xs font-semibold tabular-nums"
        style={{ color: "#9C9590" }}
      >
        {correct}/{total}
      </span>
    </div>
  );
}

export default memo(LevelProgressBar);
