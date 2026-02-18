"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameButton from "@/components/games/engine/GameButton";
import { cn } from "@/lib/utils";
import type { DepthLevel } from "@/lib/games/data/synonym-spiral/types";

interface WordInputProps {
  targetDepthLabel: string;
  targetDepth: DepthLevel;
  onSubmit: (word: string) => void;
  disabled: boolean;
  feedback: { type: "success" | "error" | "skip"; message: string } | null;
}

const DEPTH_ACCENT: Record<DepthLevel, string> = {
  1: "focus-visible:ring-[#2D2A26]/10 border-[#E8DDD6]",
  2: "focus-visible:ring-[#2D2A26]/10 border-[#E8DDD6]",
  3: "focus-visible:ring-[#2D2A26]/10 border-[#E8DDD6]",
  4: "focus-visible:ring-[#2D2A26]/10 border-[#E8DDD6]",
  5: "focus-visible:ring-[#2D2A26]/10 border-[#E8DDD6]",
};

export default function WordInput({
  targetDepthLabel,
  targetDepth,
  onSubmit,
  disabled,
  feedback,
}: WordInputProps) {
  const [value, setValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim().toLowerCase();
      if (!trimmed || disabled) return;
      onSubmit(trimmed);
      setValue("");
    },
    [value, disabled, onSubmit],
  );

  // Auto-focus on mount and after submit
  React.useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled, feedback]);

  return (
    <div className="space-y-2">
      {/* Target label */}
      <p className="text-center text-xs" style={{ color: "#6B6560" }}>
        Type a{" "}
        <span className="font-semibold" style={{ color: "#2D2A26" }}>
          {targetDepthLabel}
        </span>{" "}
        synonym
      </p>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          placeholder="Type a synonym..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className={cn(
            "flex-1 rounded-xl border bg-white px-4 py-3 text-sm placeholder:text-[#9C9590]/60",
            "outline-none focus-visible:ring-2 transition-all",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            DEPTH_ACCENT[targetDepth],
          )}
          style={{ color: "#2D2A26" }}
        />
        <GameButton
          type="submit"
          variant="primary"
          disabled={disabled || !value.trim()}
          fullWidth={false}
          className="px-5 min-w-[48px]"
        >
          →
        </GameButton>
      </form>

      {/* Feedback toast */}
      <AnimatePresence mode="wait">
        {feedback && (
          <motion.div
            key={feedback.message}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "rounded-lg px-3 py-2 text-center text-xs font-medium",
              feedback.type === "success" && "bg-[#3E5641]/10 text-[#3E5641]",
              feedback.type === "skip" && "bg-[#D4A843]/10 text-[#96782E]",
              feedback.type === "error" && "bg-[#A24936]/10 text-[#A24936]",
            )}
          >
            {feedback.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
