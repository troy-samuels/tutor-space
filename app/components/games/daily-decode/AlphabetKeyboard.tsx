"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SPRING } from "@/lib/games/springs";

interface AlphabetKeyboardProps {
  selectedLetter: string | null;
  language: string;
  usedLetters: Set<string>;
  /** Letters the player has correctly mapped */
  correctLetters?: Set<string>;
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
      rows[2].splice(rows[2].indexOf("N") + 1, 0, "Ñ");
      break;
    case "de":
      rows[0].push("Ü");
      rows[1].push("Ö", "Ä");
      rows[2].push("ß");
      break;
    case "fr":
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
  correctLetters,
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
          transition={SPRING.snappy}
          className="rounded-2xl p-3 shadow-lg"
          style={{
            background: "rgba(255,255,255,0.98)",
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          {/* Header */}
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-xs" style={{ color: "#6B6560" }}>
              Decode:{" "}
              <span className="font-mono font-bold" style={{ color: "#D36135" }}>
                {selectedLetter}
              </span>
            </span>
            <button
              onClick={onClose}
              className="rounded-md px-2 py-0.5 text-xs transition-colors touch-manipulation min-h-[44px] min-w-[44px]"
              style={{ color: "#9C9590" }}
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
                  const isCorrect = correctLetters?.has(letter) ?? false;
                  return (
                    <motion.button
                      key={letter}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => onLetterPick(letter)}
                      className="flex min-h-[44px] min-w-[2.75rem] items-center justify-center rounded-lg text-sm font-semibold transition-colors touch-manipulation select-none"
                      style={
                        isCorrect
                          ? {
                              background: "rgba(62,86,65,0.15)",
                              color: "#3E5641",
                            }
                          : isUsed
                            ? {
                                background: "rgba(0,0,0,0.03)",
                                color: "rgba(156,149,144,0.4)",
                              }
                            : {
                                background: "rgba(0,0,0,0.05)",
                                color: "#2D2A26",
                              }
                      }
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
                whileTap={{ scale: 0.96 }}
                onClick={onClear}
                className="flex min-h-[44px] items-center justify-center rounded-lg px-5 text-sm font-medium transition-colors touch-manipulation"
                style={{
                  background: "rgba(162,73,54,0.10)",
                  color: "#A24936",
                }}
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
