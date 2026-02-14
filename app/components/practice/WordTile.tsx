"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type TileState = "available" | "placed" | "correct" | "wrong";

interface WordTileProps {
  word: string;
  state: TileState;
  onClick?: () => void;
  layoutId?: string;
  disabled?: boolean;
}

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

export default function WordTile({
  word,
  state,
  onClick,
  layoutId,
  disabled = false,
}: WordTileProps) {
  const stateStyles = {
    available:
      "backdrop-blur-md bg-white/[0.04] border-white/[0.08] text-foreground hover:bg-white/[0.06] shadow-sm",
    placed:
      "backdrop-blur-md bg-primary/[0.12] border-primary/[0.25] text-primary shadow-[0_0_20px_-10px_rgba(232,120,77,0.3)]",
    correct:
      "backdrop-blur-md bg-accent/[0.2] border-accent text-accent shadow-[0_0_20px_-10px_rgba(90,122,94,0.4)]",
    wrong:
      "backdrop-blur-md bg-[#C4563F]/[0.2] border-[#C4563F] text-[#C4563F] shadow-[0_0_20px_-10px_rgba(196,86,63,0.4)]",
  };

  return (
    <motion.button
      layoutId={layoutId}
      onClick={onClick}
      disabled={disabled}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      transition={springTransition}
      animate={
        state === "wrong"
          ? { x: [-4, 4, -4, 4, 0] }
          : undefined
      }
      className={cn(
        "px-3.5 py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed",
        stateStyles[state]
      )}
    >
      {word}
    </motion.button>
  );
}
