"use client";

import { memo } from "react";
import { motion } from "framer-motion";

type TileState = "idle" | "active" | "correct" | "wrong";

interface GameTileProps {
  char: string;
  state: TileState;
  isCJK?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

const stateVariants: Record<TileState, string> = {
  idle: "bg-card border-border text-foreground",
  active:
    "bg-card border-primary text-primary ring-2 ring-primary/30",
  correct:
    "bg-accent/20 border-accent text-accent-foreground",
  wrong:
    "bg-destructive/20 border-destructive text-destructive",
};

function GameTile({
  char,
  state,
  isCJK = false,
  onClick,
  disabled = false,
}: GameTileProps) {
  const textSize = isCJK
    ? "text-4xl font-medium"
    : "text-3xl font-bold uppercase";
  const padding = isCJK ? "p-1" : "p-2";

  return (
    <motion.button
      type="button"
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        ...(state === "wrong" ? { x: [-4, 4, -4, 4, 0] } : {}),
      }}
      whileTap={!disabled ? { scale: 0.92 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${textSize} ${padding} ${stateVariants[state]}
        w-16 h-16 rounded-xl border-2 flex items-center justify-center
        shadow-lg backdrop-blur-md select-none cursor-pointer
        transition-colors duration-200
        disabled:opacity-40 disabled:cursor-not-allowed
        min-w-[48px] min-h-[48px]
      `}
    >
      {char}
    </motion.button>
  );
}

export default memo(GameTile);
