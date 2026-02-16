"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
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
  1: "focus-visible:ring-emerald-500/50 border-emerald-500/30",
  2: "focus-visible:ring-cyan-500/50 border-cyan-500/30",
  3: "focus-visible:ring-blue-500/50 border-blue-500/30",
  4: "focus-visible:ring-purple-500/50 border-purple-500/30",
  5: "focus-visible:ring-amber-500/50 border-amber-500/30",
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
      <p className="text-center text-xs text-muted-foreground">
        Type a <span className="font-semibold text-foreground">{targetDepthLabel}</span> synonym
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
            "flex-1 rounded-xl border bg-white/[0.04] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50",
            "outline-none focus-visible:ring-2 transition-all",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            DEPTH_ACCENT[targetDepth],
          )}
        />
        <Button
          type="submit"
          variant="default"
          size="sm"
          disabled={disabled || !value.trim()}
          className="rounded-xl px-4"
        >
          →
        </Button>
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
              feedback.type === "success" && "bg-emerald-500/10 text-emerald-400",
              feedback.type === "skip" && "bg-amber-500/10 text-amber-400",
              feedback.type === "error" && "bg-destructive/10 text-destructive",
            )}
          >
            {feedback.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
