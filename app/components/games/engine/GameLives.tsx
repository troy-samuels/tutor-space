"use client";

/**
 * GameLives — shared lives/hearts display
 * Used by: OddOneOut, MissingPiece
 *
 * Consistent animated lives indicator across all lives-based games.
 */

import { motion } from "framer-motion";
import { SPRING } from "@/lib/games/springs";

interface GameLivesProps {
  lives: number;
  maxLives: number;
}

export default function GameLives({ lives, maxLives }: GameLivesProps) {
  return (
    <div className="flex items-center gap-1" role="status" aria-label={`${lives} of ${maxLives} lives remaining`}>
      {Array.from({ length: maxLives }).map((_, i) => {
        const active = i < lives;
        return (
          <motion.span
            key={i}
            initial={false}
            animate={{
              scale: active ? 1 : 0.75,
              opacity: active ? 1 : 0.25,
            }}
            transition={SPRING.snappy}
            className="text-base select-none leading-none"
            style={{ color: active ? "#3E5641" : "#9C9590" }}
            aria-hidden
          >
            {active ? "●" : "○"}
          </motion.span>
        );
      })}
    </div>
  );
}
