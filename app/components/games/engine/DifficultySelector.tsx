"use client";

import { memo, useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, ArrowRight, Sparkles } from "lucide-react";
import {
  CEFR_LEVELS,
  CEFR_ORDER,
  type CefrLevel,
} from "@/lib/games/cefr";

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
    setTimeout(() => onSelect(level), 300);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <GraduationCap className="w-10 h-10 text-primary mx-auto mb-3" />
        <h2 className="text-xl font-bold text-foreground mb-1">
          Choose your level
        </h2>
        {gameName && (
          <p className="text-sm text-muted-foreground">{gameName}</p>
        )}
      </motion.div>

      <div className="w-full max-w-sm space-y-3">
        {CEFR_ORDER.map((level, i) => {
          const config = CEFR_LEVELS[level];
          const isRecommended = level === recommendedLevel;
          const isCurrent = level === currentLevel;
          const isSelected = level === selected;

          return (
            <motion.button
              key={level}
              type="button"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => handleSelect(level)}
              className={`
                w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left min-h-[72px] relative
                ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-[0_0_15px_-3px_rgba(211,97,53,0.3)]"
                    : "border-border bg-card hover:border-primary/30"
                }
              `}
            >
              {/* Level badge */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${config.bgClass}`}
              >
                {level}
              </div>

              {/* Label + description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">
                    {config.label}
                  </span>
                  {isRecommended && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary flex items-center gap-0.5">
                      <Sparkles className="w-3 h-3" />
                      Recommended
                    </span>
                  )}
                  {isCurrent && !isRecommended && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {config.description}
                </p>
              </div>

              {/* Arrow */}
              <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </motion.button>
          );
        })}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xs text-muted-foreground text-center mt-6 max-w-xs"
      >
        Content is graded using the CEFR framework — the international standard
        for language proficiency.
      </motion.p>
    </div>
  );
}

export default memo(DifficultySelector);
