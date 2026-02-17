"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AlphabetKeyboardProps {
  selectedLetter: string | null;
  language: string;
  usedLetters: Set<string>;
  onLetterPick: (letter: string) => void;
  onClear: () => void;
  onClose: () => void;
}

const BASE_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

function getKeyboardRows(language: string): string[][] {
  const rows = BASE_ROWS.map((row) => [...row]);

  switch (language) {
    case "es":
      // Add Ñ after N
      rows[2].splice(rows[2].indexOf("N") + 1, 0, "Ñ");
      break;
    case "de":
      // Add Ü, Ö, Ä, ß
      rows[0].push("Ü");
      rows[1].push("Ö", "Ä");
      rows[2].push("ß");
      break;
    case "fr":
      // Add common accented characters
      rows[0].push("É", "È");
      rows[1].push("Ê", "Ë");
      rows[2].push("Ç");
      break;
    default:
      break;
  }

  return rows;
}

export default function AlphabetKeyboard({
  selectedLetter,
  language,
  usedLetters,
  onLetterPick,
  onClear,
  onClose,
}: AlphabetKeyboardProps) {
  const rows = React.useMemo(() => getKeyboardRows(language), [language]);

  return (
    <AnimatePresence>
      {selectedLetter && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="rounded-2xl border border-border/50 bg-card/95 p-3 backdrop-blur-xl shadow-2xl"
        >
          {/* Header */}
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-xs text-muted-foreground">
              Decode: <span className="font-mono font-bold text-primary">{selectedLetter}</span>
            </span>
            <button
              onClick={onClose}
              className="rounded-md px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Keyboard rows */}
          <div className="space-y-1.5">
            {rows.map((row, rowIdx) => (
              <div key={rowIdx} className="flex justify-center gap-1">
                {row.map((letter) => {
                  const isUsed = usedLetters.has(letter);
                  return (
                    <motion.button
                      key={letter}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => onLetterPick(letter)}
                      className={cn(
                        "flex h-10 min-w-[2.2rem] items-center justify-center rounded-lg text-sm font-semibold transition-colors",
                        "touch-manipulation select-none",
                        isUsed
                          ? "bg-white/[0.03] text-muted-foreground/30"
                          : "bg-white/[0.06] text-foreground hover:bg-white/[0.12] active:bg-primary/20",
                      )}
                    >
                      {letter}
                    </motion.button>
                  );
                })}
              </div>
            ))}

            {/* Action row */}
            <div className="flex justify-center gap-2 pt-1">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClear}
                className="flex h-10 items-center justify-center rounded-lg bg-destructive/10 px-5 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors touch-manipulation"
              >
                ⌫ Clear
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
