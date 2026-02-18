"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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

  return (
    <div className="space-y-2">
      {/* Round counter + Lives */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
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
              className="text-sm"
            >
              {i < lives ? "●" : "○"}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
          className={cn(
            "h-full rounded-full transition-colors",
            lives === maxLives
              ? "bg-emerald-500"
              : lives >= 2
                ? "bg-primary"
                : "bg-amber-500",
          )}
        />
      </div>
    </div>
  );
}
