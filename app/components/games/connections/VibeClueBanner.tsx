"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface VibeClueBannerProps {
  clues: string[];
  solvedCount: number;
}

const MAX_HINTS = 3;

export default function VibeClueBanner({ clues, solvedCount }: VibeClueBannerProps) {
  const [hintsUsed, setHintsUsed] = React.useState(0);
  const [showClue, setShowClue] = React.useState(false);

  if (!clues || clues.length === 0) return null;

  const availableClues = clues.slice(0, MAX_HINTS);
  const currentClue = availableClues[hintsUsed - 1];
  const canUseHint = hintsUsed < Math.min(availableClues.length, MAX_HINTS);

  const handleUseHint = () => {
    if (!canUseHint) return;
    setHintsUsed((prev) => prev + 1);
    setShowClue(true);
  };

  // Hide clue display when a new category is solved
  React.useEffect(() => {
    if (solvedCount > 0) {
      setShowClue(false);
    }
  }, [solvedCount]);

  return (
    <div className="mt-3">
      <AnimatePresence mode="wait">
        {showClue && currentClue ? (
          <motion.div
            key={`clue-${hintsUsed}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div
              className="rounded-xl px-4 py-3 backdrop-blur-md"
              style={{
                border: "1px solid rgba(211,97,53,0.20)",
                background: "rgba(211,97,53,0.06)",
              }}
            >
              <div className="flex items-start gap-2">
                <div>
                  <p className="text-sm italic" style={{ color: "rgba(45,42,38,0.80)" }}>
                    {currentClue}
                  </p>
                  <p
                    className="mt-1 text-[10px] uppercase tracking-wider"
                    style={{ color: "#9C9590" }}
                  >
                    Hint {hintsUsed}/{Math.min(availableClues.length, MAX_HINTS)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          canUseHint && (
            <motion.div
              key="hint-button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <button
                onClick={handleUseHint}
                className="w-full rounded-xl px-4 py-2 text-xs font-medium min-h-[44px] touch-manipulation transition-colors"
                style={{ color: "#9C9590" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#D36135"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#9C9590"; }}
              >
                Need a hint? ({Math.min(availableClues.length, MAX_HINTS) - hintsUsed} remaining)
              </button>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
