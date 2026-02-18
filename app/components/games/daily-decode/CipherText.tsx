"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { stripAccent } from "@/lib/games/data/daily-decode/cipher";
import type { CipherMap } from "@/lib/games/data/daily-decode/types";

interface CipherTextProps {
  encodedText: string;
  plaintext: string;
  cipher: CipherMap;
  playerMappings: Record<string, string>;
  selectedLetter: string | null;
  hintedLetters: Set<string>;
  onLetterTap: (cipherLetter: string) => void;
  isComplete: boolean;
}

export default function CipherText({
  encodedText,
  plaintext,
  cipher,
  playerMappings,
  selectedLetter,
  hintedLetters,
  onLetterTap,
  isComplete,
}: CipherTextProps) {
  const encodedWords = encodedText.split(" ");
  const plaintextWords = plaintext.split(" ");

  let globalCharIndex = 0;

  return (
    <div className="flex flex-wrap justify-center gap-x-5 gap-y-6 px-1 sm:gap-x-8">
      {encodedWords.map((word, wordIdx) => {
        const plaintextWord = plaintextWords[wordIdx] || "";
        const startIdx = globalCharIndex;

        const cells = word.split("").map((encodedChar, charIdx) => {
          const idx = startIdx + charIdx;
          const plaintextChar = plaintextWord[charIdx] || "";
          const isLetter = /[A-Za-z]/.test(encodedChar);
          const upperEncoded = encodedChar.toUpperCase();
          const upperPlain = stripAccent(plaintextChar.toUpperCase());

          const guessed = isLetter ? playerMappings[upperEncoded] || "" : "";
          const isCorrect = isLetter && guessed.toUpperCase() === upperPlain;
          const isHinted = isLetter && hintedLetters.has(upperEncoded);
          const isSelected = isLetter && selectedLetter === upperEncoded;
          const hasGuess = isLetter && guessed !== "";

          if (!isLetter) {
            // Punctuation — render inline with appropriate sizing
            return (
              <span
                key={`${wordIdx}-${charIdx}`}
                className="flex flex-col items-center justify-end"
              >
                <span className="h-8 flex items-center text-base font-medium" style={{ color: "#6B6560" }}>
                  {encodedChar}
                </span>
                <span className="h-5" />
              </span>
            );
          }

          // Determine tile style
          let tileBackground = "rgba(0,0,0,0.03)";
          let tileBorder = "1.5px dashed rgba(0,0,0,0.12)";
          let guessColor = "transparent";

          if (isComplete || isCorrect || isHinted) {
            tileBackground = "rgba(62,86,65,0.10)";
            tileBorder = "1.5px solid rgba(62,86,65,0.30)";
            guessColor = "#3E5641";
          } else if (isSelected) {
            tileBackground = "rgba(211,97,53,0.12)";
            tileBorder = "2px solid rgba(211,97,53,0.50)";
            guessColor = hasGuess ? "#2D2A26" : "transparent";
          } else if (hasGuess) {
            tileBackground = "rgba(255,255,255,0.8)";
            tileBorder = "1.5px solid rgba(0,0,0,0.12)";
            guessColor = "#2D2A26";
          }

          return (
            <motion.button
              key={`${wordIdx}-${charIdx}-${idx}`}
              onClick={() => onLetterTap(upperEncoded)}
              disabled={isComplete || isHinted}
              whileTap={!isComplete && !isHinted ? { scale: 0.93 } : undefined}
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-150",
                "touch-manipulation select-none",
                !isComplete && !isHinted && "cursor-pointer active:brightness-95",
                (isComplete || isHinted) && "cursor-default",
              )}
            >
              {/* Guess tile — the main interactive element */}
              <div
                className="flex items-center justify-center rounded-lg w-8 h-8 sm:w-10 sm:h-10"
                style={{
                  background: tileBackground,
                  border: tileBorder,
                  transition: "all 0.15s ease",
                }}
              >
                <span
                  className="font-mono text-base sm:text-lg font-bold leading-none"
                  style={{ color: guessColor }}
                >
                  {isHinted
                    ? cipher.decrypt[upperEncoded] || ""
                    : guessed || ""}
                </span>
              </div>

              {/* Cipher letter label — the encoded character below */}
              <span
                className="text-xs sm:text-sm font-semibold font-mono leading-none"
                style={{
                  color: isSelected
                    ? "#D36135"
                    : isCorrect || isHinted
                      ? "rgba(62,86,65,0.5)"
                      : "rgba(107,101,96,0.7)",
                }}
              >
                {encodedChar.toUpperCase()}
              </span>
            </motion.button>
          );
        });

        globalCharIndex += word.length + 1;

        return (
          <div
            key={wordIdx}
            className="flex gap-0.5 sm:gap-1 rounded-xl px-1.5 py-1"
            style={{
              background: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(0,0,0,0.04)",
            }}
          >
            {cells}
          </div>
        );
      })}
    </div>
  );
}
