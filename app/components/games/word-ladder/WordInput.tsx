"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameButton from "@/components/games/engine/GameButton";
import { cn } from "@/lib/utils";

interface WordInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  maxLength: number;
  error: string | null;
  disabled: boolean;
  lastWord: string;
}

export default function WordInput({
  value,
  onChange,
  onSubmit,
  maxLength,
  error,
  disabled,
  lastWord,
}: WordInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && value.length === maxLength) {
        onSubmit();
      }
    },
    [onSubmit, value.length, maxLength],
  );

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÜÑÀÂÄÈÊËÎÏÔÙÛÇŒÆ]/g, "");
      if (raw.length <= maxLength) {
        onChange(raw);
      }
    },
    [onChange, maxLength],
  );

  // Auto-focus input
  React.useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  return (
    <div className="space-y-3">
      {/* Input field */}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Change 1 letter..."
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className={cn(
            "flex-1 rounded-xl border px-4 py-3 text-center text-lg font-semibold tracking-widest placeholder:text-[#9C9590]/60",
            "focus:outline-none focus:ring-2 focus:ring-[#2D2A26]/10 focus:border-[#2D2A26]/20",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            error
              ? "border-[#A24936]/40 bg-[#A24936]/[0.04]"
              : "border-[#E8DDD6] bg-white",
          )}
          style={{ color: "#2D2A26" }}
        />
        <GameButton
          onClick={onSubmit}
          disabled={disabled || value.length !== maxLength}
          variant="primary"
          fullWidth={false}
          className="px-6 min-w-[52px]"
        >
          →
        </GameButton>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex justify-center"
          >
            <span
              className="rounded-full border px-3 py-0.5 text-xs font-medium"
              style={{ borderColor: "rgba(162,73,54,0.3)", color: "#A24936", background: "rgba(162,73,54,0.06)" }}
            >
              {error}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
