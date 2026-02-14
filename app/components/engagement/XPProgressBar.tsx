"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface XPProgressBarProps {
  currentLevel: number;
  currentXp: number;
  xpToNextLevel: number;
  showLabel?: boolean;
  compact?: boolean;
}

export default function XPProgressBar({
  currentLevel,
  currentXp,
  xpToNextLevel,
  showLabel = true,
  compact = false,
}: XPProgressBarProps) {
  const progress = (currentXp / xpToNextLevel) * 100;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{currentLevel}</span>
          </div>
        </div>
        <div className="flex-1">
          <Progress value={progress} className="h-2" />
        </div>
        <span className="text-xs text-muted-foreground">
          {currentXp}/{xpToNextLevel}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              <Zap className="w-4 h-4 text-primary" />
            </motion.div>
            <span className="text-sm font-medium text-foreground">
              Level {currentLevel}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {currentXp} / {xpToNextLevel} XP
          </span>
        </div>
      )}

      <div className="relative">
        <Progress value={progress} className="h-3" />
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-accent rounded-full opacity-30"
        />
      </div>

      {showLabel && (
        <p className="text-xs text-muted-foreground text-center">
          {xpToNextLevel - currentXp} XP to level {currentLevel + 1}
        </p>
      )}
    </div>
  );
}
