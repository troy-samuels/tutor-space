"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
            <div className="rounded-xl border border-primary/20 bg-primary/[0.06] px-4 py-3 backdrop-blur-md">
              <div className="flex items-start gap-2">
                
                <div>
                  <p className="text-sm italic text-foreground/80">{currentClue}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUseHint}
                className={cn(
                  "w-full rounded-xl text-xs text-muted-foreground",
                  "hover:text-primary",
                )}
              >
                Need a hint? ({Math.min(availableClues.length, MAX_HINTS) - hintsUsed} remaining)
              </Button>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
