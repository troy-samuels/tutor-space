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
    <div className="flex flex-wrap justify-center gap-x-3 gap-y-4">
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
                <span className="h-6 text-base text-foreground">{encodedChar}</span>
                <span className="h-4" />
              </span>
            );
          }

          return (
            <motion.button
              key={`${wordIdx}-${charIdx}`}
              onClick={() => onLetterTap(upperEncoded)}
              disabled={isComplete || isHinted}
              whileTap={!isComplete ? { scale: 0.9 } : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-md px-1 py-0.5 transition-colors",
                "touch-manipulation select-none",
                isSelected && "bg-primary/20 ring-1 ring-primary/50",
                isCorrect && !isHinted && "bg-[#A0C35A]/15",
                isHinted && "bg-[#B0C4EF]/15",
                !isCorrect && hasGuess && !isSelected && "bg-destructive/10",
                !isComplete && !isHinted && "hover:bg-white/[0.06] cursor-pointer",
                isComplete && "cursor-default",
              )}
            >
              {/* Player's guess (top) */}
              <span
                className={cn(
                  "h-6 min-w-[1.2rem] text-center font-mono text-base font-bold",
                  isCorrect || isHinted
                    ? "text-[#A0C35A]"
                    : hasGuess
                      ? "text-foreground"
                      : "text-transparent",
                )}
              >
                {isHinted
                  ? cipher.decrypt[upperEncoded] || ""
                  : guessed || "_"}
              </span>

              {/* Divider line */}
              <div
                className={cn(
                  "h-px w-full min-w-[1.2rem]",
                  isSelected
                    ? "bg-primary/60"
                    : isCorrect || isHinted
                      ? "bg-[#A0C35A]/40"
                      : "bg-white/[0.15]",
                )}
              />

              {/* Encoded letter (bottom) */}
              <span className="h-4 min-w-[1.2rem] text-center text-[10px] font-medium text-muted-foreground/70">
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
