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
  // Split into words for wrapping
  const encodedWords = encodedText.split(" ");
  const plaintextWords = plaintext.split(" ");

  let globalCharIndex = 0;

  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-5 overflow-hidden px-1 sm:gap-x-6">
      {encodedWords.map((word, wordIdx) => {
        const plaintextWord = plaintextWords[wordIdx] || "";
        const startIdx = globalCharIndex;

        const cells = word.split("").map((encodedChar, charIdx) => {
          const idx = startIdx + charIdx;
          const plaintextChar = plaintextWord[charIdx] || "";
          const isLetter = /[A-Za-z]/.test(encodedChar);
          const upperEncoded = encodedChar.toUpperCase();
          const upperPlain = stripAccent(plaintextChar.toUpperCase());

          // What has the player guessed for this cipher letter?
          const guessed = isLetter ? playerMappings[upperEncoded] || "" : "";
          const isCorrect = isLetter && guessed.toUpperCase() === upperPlain;
          const isHinted = isLetter && hintedLetters.has(upperEncoded);
          const isSelected = isLetter && selectedLetter === upperEncoded;
          const hasGuess = isLetter && guessed !== "";

          if (!isLetter) {
            // Punctuation / special chars
            return (
              <span
                key={`${wordIdx}-${charIdx}`}
                className="flex flex-col items-center"
              >
                <span className="h-6 text-base" style={{ color: "#2D2A26" }}>
                  {encodedChar}
                </span>
                <span className="h-4" />
              </span>
            );
          }

          // Build background colour based on state
          const bgStyle: React.CSSProperties = {};
          if (isSelected) {
            bgStyle.background = "rgba(211,97,53,0.15)";
            bgStyle.boxShadow = "0 0 0 1px rgba(211,97,53,0.40)";
            bgStyle.borderRadius = "6px";
          } else if (isCorrect && !isHinted) {
            bgStyle.background = "rgba(62,86,65,0.12)";
            bgStyle.borderRadius = "6px";
          } else if (isHinted) {
            bgStyle.background = "rgba(62,86,65,0.08)";
            bgStyle.borderRadius = "6px";
          } else if (!isCorrect && hasGuess) {
            bgStyle.background = "rgba(162,73,54,0.08)";
            bgStyle.borderRadius = "6px";
          }

          return (
            <motion.button
              key={`${wordIdx}-${charIdx}-${idx}`}
              onClick={() => onLetterTap(upperEncoded)}
              disabled={isComplete || isHinted}
              whileTap={!isComplete ? { scale: 0.96 } : undefined}
              style={bgStyle}
              className={cn(
                "flex flex-col items-center gap-0.5 px-0.5 py-1 transition-colors min-w-[1.5rem] sm:min-w-[2rem] sm:px-1",
                "touch-manipulation select-none cursor-pointer",
                !isComplete && !isHinted && "hover:brightness-95",
                (isComplete || isHinted) && "cursor-default",
              )}
            >
              {/* Player's guess (top) */}
              <span
                className="h-6 min-w-[1.25rem] sm:min-w-[1.75rem] text-center font-mono text-sm sm:text-base font-bold"
                style={{
                  color:
                    isCorrect || isHinted
                      ? "#3E5641" // brand sage green for correct
                      : hasGuess
                        ? "#2D2A26" // brand text primary for guesses
                        : "transparent",
                }}
              >
                {isHinted
                  ? cipher.decrypt[upperEncoded] || ""
                  : guessed || "_"}
              </span>

              {/* Divider line */}
              <div
                className="h-px w-full min-w-[1.25rem] sm:min-w-[1.75rem]"
                style={{
                  background: isSelected
                    ? "rgba(211,97,53,0.60)"
                    : isCorrect || isHinted
                      ? "rgba(62,86,65,0.40)"
                      : "rgba(0,0,0,0.15)",
                }}
              />

              {/* Encoded letter (bottom) */}
              <span
                className="h-4 min-w-[1.25rem] sm:min-w-[1.75rem] text-center text-[10px] sm:text-[11px] font-medium"
                style={{ color: "rgba(156,149,144,0.8)" }}
              >
                {encodedChar.toUpperCase()}
              </span>
            </motion.button>
          );
        });

        globalCharIndex += word.length + 1; // +1 for space

        return (
          <div key={wordIdx} className="flex gap-0.5">
            {cells}
          </div>
        );
      })}
    </div>
  );
}
