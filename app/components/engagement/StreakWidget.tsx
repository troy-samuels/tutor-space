"use client";

import { motion } from "framer-motion";
import { Flame, Snowflake } from "lucide-react";
import type { StreakData } from "@/lib/engagement/types";

interface StreakWidgetProps {
  streakData: StreakData;
  compact?: boolean;
  onUseFreeze?: () => void;
}

export default function StreakWidget({
  streakData,
  compact = false,
  onUseFreeze,
}: StreakWidgetProps) {
  const today = new Date().toISOString().split("T")[0];
  const isPracticedToday = streakData.lastPracticeDate === today;
  const freezeUsedToday = streakData.freezeUsedAt === today;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <motion.div
          animate={{
            scale: isPracticedToday ? [1, 1.2, 1] : [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <Flame className="w-5 h-5 text-primary" />
        </motion.div>
        <span className="text-sm font-semibold text-foreground">
          {streakData.current}
        </span>
        {streakData.freezesAvailable > 0 && (
          <div className="flex gap-0.5">
            {[...Array(streakData.freezesAvailable)].map((_, i) => (
              <Snowflake key={i} className="w-3 h-3 text-blue-400" />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
      <motion.div
        animate={{
          scale: isPracticedToday ? [1, 1.2, 1] : [1, 1.1, 1],
          rotate: isPracticedToday ? [0, 5, -5, 0] : 0,
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className="relative"
      >
        <Flame className="w-10 h-10 text-primary" />
        {freezeUsedToday && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1"
          >
            <Snowflake className="w-5 h-5 text-blue-400" />
          </motion.div>
        )}
      </motion.div>

      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-bold text-foreground">
            {streakData.current}
          </span>
          <span className="text-sm text-muted-foreground">day streak</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Longest: {streakData.longest}</span>
          {streakData.freezesAvailable > 0 && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Snowflake className="w-3 h-3 text-blue-400" />
                <span>
                  {streakData.freezesAvailable} freeze
                  {streakData.freezesAvailable !== 1 ? "s" : ""} left
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {!isPracticedToday && !freezeUsedToday && streakData.current > 0 && (
        <div className="text-xs text-muted-foreground">
          {streakData.freezesAvailable > 0 && onUseFreeze ? (
            <button
              onClick={onUseFreeze}
              className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors flex items-center gap-1"
            >
              <Snowflake className="w-3 h-3" />
              Use Freeze
            </button>
          ) : (
            <span className="text-amber-500">Practice today!</span>
          )}
        </div>
      )}

      {isPracticedToday && (
        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">
          ✓ Today
        </span>
      )}
    </div>
  );
}
