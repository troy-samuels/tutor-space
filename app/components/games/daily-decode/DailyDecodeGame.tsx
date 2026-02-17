"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CipherText from "./CipherText";
import AlphabetKeyboard from "./AlphabetKeyboard";
import QuoteReveal from "./QuoteReveal";
import { recordGamePlay } from "@/lib/games/streaks";
import {
  preparePuzzle,
  generateShareText,
  stripAccent,
} from "@/lib/games/data/daily-decode";
import { haptic } from "@/lib/games/haptics";
import { cn } from "@/lib/utils";
import type {
  DecodePuzzle,
  CipherMap,
  DailyDecodeGameState,
} from "@/lib/games/data/daily-decode/types";

interface DailyDecodeGameProps {
  puzzle: DecodePuzzle;
  onGameEnd?: (state: { isComplete: boolean; isWon: boolean; mistakes: number }) => void;
}

const MAX_HINTS = 3;

export default function DailyDecodeGame({ puzzle, onGameEnd }: DailyDecodeGameProps) {
  const prepared = React.useMemo(() => preparePuzzle(puzzle), [puzzle]);

  const [gameState, setGameState] = React.useState<DailyDecodeGameState>(() => ({
    puzzle,
    cipher: prepared.cipher,
    encodedText: prepared.encodedText,
    playerMappings: {},
    selectedLetter: null,
    hintsUsed: 0,
    maxHints: MAX_HINTS,
    hintedLetters: new Set(),
    isComplete: false,
    isWon: false,
    mistakes: 0,
    startTime: Date.now(),
  }));

  const [copied, setCopied] = React.useState(false);

  // Compute used letters (letters already assigned as guesses)
  const usedLetters = React.useMemo(() => {
    const used = new Set<string>();
    for (const guess of Object.values(gameState.playerMappings)) {
      if (guess) used.add(guess.toUpperCase());
    }
    return used;
  }, [gameState.playerMappings]);

  // Check for win
  const checkWin = React.useCallback(
    (mappings: Record<string, string>, hinted: Set<string>, cipher: CipherMap): boolean => {
      // Every cipher letter used in the text must be correctly mapped
      const encoded = prepared.encodedText;
      for (const ch of encoded) {
        const upper = ch.toUpperCase();
        if (!/[A-Z]/.test(upper)) continue;

        const expectedPlain = cipher.decrypt[upper];
        if (!expectedPlain) continue;

        if (hinted.has(upper)) continue; // hinted letters are correct by definition

        const guessed = mappings[upper];
        if (!guessed || guessed.toUpperCase() !== expectedPlain) return false;
      }
      return true;
    },
    [prepared.encodedText],
  );

  // Notify parent on game end
  React.useEffect(() => {
    if (gameState.isComplete && onGameEnd) {
      onGameEnd({
        isComplete: gameState.isComplete,
        isWon: gameState.isWon,
        mistakes: gameState.mistakes,
      });
    }
  }, [gameState.isComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLetterTap = React.useCallback((cipherLetter: string) => {
    if (gameState.isComplete) return;
    setGameState((prev) => ({
      ...prev,
      selectedLetter: prev.selectedLetter === cipherLetter ? null : cipherLetter,
    }));
  }, [gameState.isComplete]);

  const handleLetterPick = React.useCallback(
    (letter: string) => {
      if (!gameState.selectedLetter || gameState.isComplete) return;

      setGameState((prev) => {
        // Remove any existing mapping of this guess letter to avoid duplicates
        const newMappings: Record<string, string> = {};
        for (const [k, v] of Object.entries(prev.playerMappings)) {
          if (v.toUpperCase() !== letter.toUpperCase()) {
            newMappings[k] = v;
          }
        }

        // Set new mapping
        newMappings[prev.selectedLetter!] = letter;

        // Check if this guess is wrong
        const expectedPlain = prev.cipher.decrypt[prev.selectedLetter!];
        const isWrong = expectedPlain && letter.toUpperCase() !== expectedPlain;
        const newMistakes = isWrong ? prev.mistakes + 1 : prev.mistakes;

        if (isWrong) haptic("error");
        else haptic("tap");

        // Check for win
        const won = checkWin(newMappings, prev.hintedLetters, prev.cipher);

        if (won) {
          recordGamePlay("daily-decode");
        }

        return {
          ...prev,
          playerMappings: newMappings,
          selectedLetter: null,
          mistakes: newMistakes,
          isComplete: won,
          isWon: won,
          endTime: won ? Date.now() : undefined,
        };
      });
    },
    [gameState.selectedLetter, gameState.isComplete, checkWin],
  );

  const handleClear = React.useCallback(() => {
    if (!gameState.selectedLetter || gameState.isComplete) return;

    setGameState((prev) => {
      const newMappings = { ...prev.playerMappings };
      delete newMappings[prev.selectedLetter!];
      return {
        ...prev,
        playerMappings: newMappings,
        selectedLetter: null,
      };
    });
  }, [gameState.selectedLetter, gameState.isComplete]);

  const handleCloseKeyboard = React.useCallback(() => {
    setGameState((prev) => ({ ...prev, selectedLetter: null }));
  }, []);

  const handleHint = React.useCallback(() => {
    if (gameState.hintsUsed >= MAX_HINTS || gameState.isComplete) return;

    setGameState((prev) => {
      // Find a cipher letter that hasn't been correctly guessed or hinted
      const unsolvedLetters: string[] = [];
      for (const ch of prepared.encodedText) {
        const upper = ch.toUpperCase();
        if (!/[A-Z]/.test(upper)) continue;
        if (prev.hintedLetters.has(upper)) continue;
        const expected = prev.cipher.decrypt[upper];
        const guessed = prev.playerMappings[upper];
        if (!guessed || guessed.toUpperCase() !== expected) {
          if (!unsolvedLetters.includes(upper)) {
            unsolvedLetters.push(upper);
          }
        }
      }

      if (unsolvedLetters.length === 0) return prev;

      // Pick the most frequent unsolved letter
      const freqMap: Record<string, number> = {};
      for (const ch of prepared.encodedText) {
        const upper = ch.toUpperCase();
        if (unsolvedLetters.includes(upper)) {
          freqMap[upper] = (freqMap[upper] || 0) + 1;
        }
      }

      const sorted = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);
      const hintLetter = sorted[0][0];

      const newHinted = new Set(prev.hintedLetters);
      newHinted.add(hintLetter);

      // Also set the correct mapping
      const newMappings = { ...prev.playerMappings };
      const correctLetter = prev.cipher.decrypt[hintLetter];
      newMappings[hintLetter] = correctLetter;

      // Check for win after hint
      const won = checkWin(newMappings, newHinted, prev.cipher);

      if (won) {
        recordGamePlay("daily-decode");
      }

      return {
        ...prev,
        hintsUsed: prev.hintsUsed + 1,
        hintedLetters: newHinted,
        playerMappings: newMappings,
        selectedLetter: null,
        isComplete: won,
        isWon: won,
        endTime: won ? Date.now() : undefined,
      };
    });
  }, [gameState.hintsUsed, gameState.isComplete, prepared.encodedText, checkWin]);

  const handleShare = React.useCallback(async () => {
    const timeMs = (gameState.endTime || Date.now()) - gameState.startTime;
    const text = generateShareText(
      puzzle.number,
      puzzle.language,
      gameState.hintsUsed,
      timeMs,
    );
    try {
      if (navigator.share) {
        await navigator.share({ title: "Daily Decode", text });
        return;
      }
    } catch {
      // fallthrough
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [gameState, puzzle]);

  return (
    <div className="space-y-5">
      {/* Difficulty & hints bar */}
      <div className="flex items-center justify-center gap-3">
        <Badge variant="outline" className="gap-1 text-xs capitalize">
          {puzzle.difficulty === "easy" ? "🟢" : puzzle.difficulty === "medium" ? "🟡" : "🔴"}{" "}
          {puzzle.difficulty}
        </Badge>
        <Badge variant="outline" className="gap-1 text-xs">
          💡 Hints: {gameState.hintsUsed}/{MAX_HINTS}
        </Badge>
      </div>

      {/* Cipher text display */}
      <div className="rounded-2xl border border-border/50 bg-card/50 p-3">
        <CipherText
          encodedText={prepared.encodedText}
          plaintext={puzzle.plaintext}
          cipher={prepared.cipher}
          playerMappings={gameState.playerMappings}
          selectedLetter={gameState.selectedLetter}
          hintedLetters={gameState.hintedLetters}
          onLetterTap={handleLetterTap}
          isComplete={gameState.isComplete}
        />
      </div>

      {/* Keyboard */}
      {!gameState.isComplete && (
        <AlphabetKeyboard
          selectedLetter={gameState.selectedLetter}
          language={puzzle.language}
          usedLetters={usedLetters}
          onLetterPick={handleLetterPick}
          onClear={handleClear}
          onClose={handleCloseKeyboard}
        />
      )}

      {/* Hint button */}
      {!gameState.isComplete && gameState.hintsUsed < MAX_HINTS && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleHint}
          className="w-full rounded-xl text-xs text-muted-foreground hover:text-primary"
        >
          💡 Use a hint ({MAX_HINTS - gameState.hintsUsed} remaining)
        </Button>
      )}

      {/* Victory */}
      <AnimatePresence>
        {gameState.isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
            className="mt-4 space-y-4"
          >
            {/* Quote reveal */}
            <QuoteReveal plaintext={puzzle.plaintext} author={puzzle.author} />

            {/* Result banner */}
            <div className="rounded-2xl border border-border/50 bg-card p-6 text-center">
              <div className="text-4xl">
                {gameState.hintsUsed === 0 ? "🏆" : "🎉"}
              </div>
              <h2 className="mt-2 font-heading text-xl text-foreground">
                {gameState.hintsUsed === 0 ? "Perfect decode!" : "Decoded!"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {gameState.hintsUsed === 0
                  ? "No hints used — impressive!"
                  : `${gameState.hintsUsed} hint${gameState.hintsUsed !== 1 ? "s" : ""} used`}
              </p>

              {/* Time */}
              {gameState.endTime && (
                <p className="mt-3 text-xs text-muted-foreground">
                  ⏱{" "}
                  {(() => {
                    const secs = Math.floor(
                      (gameState.endTime - gameState.startTime) / 1000,
                    );
                    return `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, "0")}`;
                  })()}
                </p>
              )}
            </div>

            {/* Share button */}
            <Button
              onClick={handleShare}
              variant="default"
              size="lg"
              className="w-full rounded-xl"
            >
              {copied ? "✓ Copied!" : "📋 Share Result"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
