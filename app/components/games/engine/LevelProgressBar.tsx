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
        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${config.bgClass}`}
      >
        {level}
      </div>

      {/* Progress track */}
      <div className="flex-1">
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${config.bgClass}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, progress)}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      {/* Score */}
      <span className="flex-shrink-0 text-xs font-semibold text-muted-foreground tabular-nums">
        {correct}/{total}
      </span>
    </div>
  );
}

export default memo(LevelProgressBar);
