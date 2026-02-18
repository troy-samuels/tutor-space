"use client";

import { memo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import {
  CEFR_LEVELS,
  CEFR_ORDER,
  type CefrLevel,
} from "@/lib/games/cefr";
import { cn } from "@/lib/utils";

interface DifficultySelectorProps {
  onSelect: (level: CefrLevel) => void;
  /** Previously detected/recommended level */
  recommendedLevel?: CefrLevel;
  /** Player's current level from progress */
  currentLevel?: CefrLevel;
  gameName?: string;
}

function DifficultySelector({
  onSelect,
  recommendedLevel,
  currentLevel,
  gameName,
}: DifficultySelectorProps) {
  const [selected, setSelected] = useState<CefrLevel | null>(null);

  const handleSelect = (level: CefrLevel) => {
    setSelected(level);
    setTimeout(() => onSelect(level), 250);
  };

  return (
    <div className="flex flex-col min-h-[50vh] px-4 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5"
      >
        <h2 className="text-lg font-bold text-foreground">
          Choose your level
        </h2>
        {gameName && (
          <p className="text-xs text-muted-foreground mt-0.5">{gameName}</p>
        )}
      </motion.div>

      {/* Level list — full-width, compact */}
      <div className="w-full space-y-2 flex-1">
        {CEFR_ORDER.map((level, i) => {
          const config = CEFR_LEVELS[level];
          const isRecommended = level === recommendedLevel;
          const isCurrent = level === currentLevel;
          const isSelected = level === selected;

          return (
            <motion.button
              key={level}
              type="button"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleSelect(level)}
              whileTap={{ scale: 0.96 }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-all text-left min-h-[56px] relative",
                "touch-manipulation",
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border/50 bg-card hover:border-primary/30",
              )}
            >
              {/* Level badge */}
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0",
                  config.bgClass,
                )}
              >
                {level}
              </div>

              {/* Label + description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm text-foreground">
                    {config.label}
                  </span>
                  {isRecommended && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      Rec
                    </span>
                  )}
                  {isCurrent && !isRecommended && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-accent/15 text-accent">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {config.description}
                </p>
              </div>

              {/* Chevron */}
              <svg
                className="w-4 h-4 text-muted-foreground/40 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          );
        })}
      </div>

      {/* CEFR note — compact */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-[10px] text-muted-foreground/60 text-center mt-4"
      >
        Graded using the CEFR international standard
      </motion.p>
    </div>
  );
}

export default memo(DifficultySelector);
