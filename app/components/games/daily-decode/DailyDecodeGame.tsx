"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SPRING } from "@/lib/games/springs";
import CipherText from "./CipherText";
import GameResultCard from "@/components/games/engine/GameResultCard";
import GameButton from "@/components/games/engine/GameButton";
import AlphabetKeyboard from "./AlphabetKeyboard";
import QuoteReveal from "./QuoteReveal";
import { recordGamePlay } from "@/lib/games/streaks";
import {
  preparePuzzle,
  generateShareText,
  stripAccent,
} from "@/lib/games/data/daily-decode";
import { haptic } from "@/lib/games/haptics";
import { shareResult } from "@/components/games/engine/share";
import { fireConfetti } from "@/lib/games/juice";
import type {
  DecodePuzzle,
  CipherMap,
  DailyDecodeGameState,
} from "@/lib/games/data/daily-decode/types";

interface DailyDecodeGameProps {
  puzzle: DecodePuzzle;
  onGameEnd?: (state: { isComplete: boolean; isWon: boolean; mistakes: number }) => void;
  onPlayAgain?: () => void;
}

const MAX_HINTS = 3;

/**
 * Pick starter letters to pre-reveal.
 * Strategy: reveal 2 of the most frequent letters to give players a foothold.
 * For English: typically E and T. For other languages: the top 2 by frequency in the text.
 */
function pickStarterLetters(
  encodedText: string,
  cipher: CipherMap,
  count: number = 2,
): string[] {
  // Count frequency of each cipher letter in the encoded text
  const freq: Record<string, number> = {};
  for (const ch of encodedText) {
    const upper = ch.toUpperCase();
    if (/[A-Z]/.test(upper)) {
      freq[upper] = (freq[upper] || 0) + 1;
    }
  }

  // Sort by frequency descending and take top `count`
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([letter]) => letter);
}

export default function DailyDecodeGame({ puzzle, onGameEnd, onPlayAgain }: DailyDecodeGameProps) {
  const prepared = React.useMemo(() => preparePuzzle(puzzle), [puzzle]);

  const [gameState, setGameState] = React.useState<DailyDecodeGameState>(() => {
    // Pre-reveal starter letters
    const starters = pickStarterLetters(prepared.encodedText, prepared.cipher, 2);
    const starterHinted = new Set(starters);
    const starterMappings: Record<string, string> = {};
    for (const cipherLetter of starters) {
      const plainLetter = prepared.cipher.decrypt[cipherLetter];
      if (plainLetter) {
        starterMappings[cipherLetter] = plainLetter;
      }
    }

    return {
      puzzle,
      cipher: prepared.cipher,
      encodedText: prepared.encodedText,
      playerMappings: starterMappings,
      selectedLetter: null,
      hintsUsed: 0,
      maxHints: MAX_HINTS,
      hintedLetters: starterHinted,
      isComplete: false,
      isWon: false,
      mistakes: 0,
      startTime: Date.now(),
    };
  });

  const [copied, setCopied] = React.useState(false);
  const resultRef = React.useRef<HTMLDivElement>(null);

  // Proper cleanup ref
  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    return () => { if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current); };
  }, []);

  // Stable ref to latest onGameEnd callback + single-fire guard
  const onGameEndRef = React.useRef(onGameEnd);
  React.useEffect(() => { onGameEndRef.current = onGameEnd; });
  const hasNotifiedRef = React.useRef(false);

  // Compute used letters (letters already assigned as guesses)
  const usedLetters = React.useMemo(() => {
    const used = new Set<string>();
    for (const guess of Object.values(gameState.playerMappings)) {
      if (guess) used.add(guess.toUpperCase());
    }
    return used;
  }, [gameState.playerMappings]);

  // Compute correctly mapped letters for keyboard highlighting
  const correctLetters = React.useMemo(() => {
    const correct = new Set<string>();
    for (const [cipherLetter, guess] of Object.entries(gameState.playerMappings)) {
      if (!guess) continue;
      const expected = gameState.cipher.decrypt[cipherLetter];
      if (expected && guess.toUpperCase() === expected) {
        correct.add(guess.toUpperCase());
      }
    }
    return correct;
  }, [gameState.playerMappings, gameState.cipher.decrypt]);

  // Count progress
  const progressInfo = React.useMemo(() => {
    const uniqueCipherLetters = new Set<string>();
    for (const ch of prepared.encodedText) {
      const upper = ch.toUpperCase();
      if (/[A-Z]/.test(upper)) uniqueCipherLetters.add(upper);
    }
    const total = uniqueCipherLetters.size;
    let solved = 0;
    for (const cl of uniqueCipherLetters) {
      const expected = gameState.cipher.decrypt[cl];
      const guessed = gameState.playerMappings[cl];
      if (gameState.hintedLetters.has(cl) || (guessed && guessed.toUpperCase() === expected)) {
        solved++;
      }
    }
    return { solved, total };
  }, [prepared.encodedText, gameState.cipher.decrypt, gameState.playerMappings, gameState.hintedLetters]);

  // Check for win
  const checkWin = React.useCallback(
    (mappings: Record<string, string>, hinted: Set<string>, cipher: CipherMap): boolean => {
      const encoded = prepared.encodedText;
      for (const ch of encoded) {
        const upper = ch.toUpperCase();
        if (!/[A-Z]/.test(upper)) continue;

        const expectedPlain = cipher.decrypt[upper];
        if (!expectedPlain) continue;

        if (hinted.has(upper)) continue;

        const guessed = mappings[upper];
        if (!guessed || guessed.toUpperCase() !== expectedPlain) return false;
      }
      return true;
    },
    [prepared.encodedText],
  );

  // Notify parent on game end (fires exactly once)
  React.useEffect(() => {
    if (!gameState.isComplete || hasNotifiedRef.current) return;
    hasNotifiedRef.current = true;
    onGameEndRef.current?.({
      isComplete: gameState.isComplete,
      isWon: gameState.isWon,
      mistakes: gameState.mistakes,
    });
  }, [gameState]);

  // Scroll result card into view when game ends
  React.useEffect(() => {
    if (!gameState.isComplete) return;
    const timer = setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 350);
    return () => clearTimeout(timer);
  }, [gameState.isComplete]);

  // Victory confetti
  React.useEffect(() => {
    if (!gameState.isComplete || !gameState.isWon) return;
    const timer = setTimeout(() => {
      void fireConfetti({
        particleCount: 65,
        spread: 85,
        startVelocity: 30,
        gravity: 0.8,
        ticks: 85,
        origin: { y: 0.5 },
        colors: ["#D36135", "#3E5641", "#D4A843", "#FFFFFF", "#5A8AB5"],
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [gameState.isComplete, gameState.isWon]);

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

        newMappings[prev.selectedLetter!] = letter;

        const expectedPlain = prev.cipher.decrypt[prev.selectedLetter!];
        const isWrong = expectedPlain && letter.toUpperCase() !== expectedPlain;
        const newMistakes = isWrong ? prev.mistakes + 1 : prev.mistakes;

        if (isWrong) haptic("error");
        else haptic("tap");

        const won = checkWin(newMappings, prev.hintedLetters, prev.cipher);
        if (won) recordGamePlay("daily-decode");

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

      const newMappings = { ...prev.playerMappings };
      const correctLetter = prev.cipher.decrypt[hintLetter];
      newMappings[hintLetter] = correctLetter;

      const won = checkWin(newMappings, newHinted, prev.cipher);
      if (won) recordGamePlay("daily-decode");

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
    await shareResult(text, "Daily Decode", setCopied, copyTimeoutRef);
  }, [gameState, puzzle]);

  return (
    <div className="space-y-4">
      {/* Top bar: difficulty, progress, hints */}
      <div className="flex items-center justify-between px-1">
        <span
          className="rounded-full border px-3 py-0.5 text-xs font-medium capitalize"
          style={{ color: "#6B6560", borderColor: "rgba(0,0,0,0.10)" }}
        >
          {puzzle.difficulty === "easy" ? "Easy 🟢" : puzzle.difficulty === "medium" ? "Medium 🟡" : "Hard 🔴"}
        </span>

        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ width: "4rem", background: "rgba(0,0,0,0.06)" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: "#3E5641" }}
                initial={{ width: 0 }}
                animate={{
                  width: `${progressInfo.total > 0 ? (progressInfo.solved / progressInfo.total) * 100 : 0}%`,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-[11px] tabular-nums font-medium" style={{ color: "#9C9590" }}>
              {progressInfo.solved}/{progressInfo.total}
            </span>
          </div>
          <span className="text-xs tabular-nums" style={{ color: "#9C9590" }}>
            💡 {gameState.hintsUsed}/{MAX_HINTS}
          </span>
        </div>
      </div>

      {/* Author attribution — contextual hint */}
      {!gameState.isComplete && puzzle.author && (
        <p className="text-center text-sm font-medium italic" style={{ color: "#7A756F" }}>
          — {puzzle.author}
        </p>
      )}

      {/* Instruction — always visible until game is won */}
      {!gameState.isComplete && (
        <p
          className="text-center text-xs leading-relaxed"
          style={{ color: "var(--game-text-muted, #9C9590)" }}
        >
          {gameState.selectedLetter
            ? <>Now pick what <span className="font-bold font-mono" style={{ color: "#D36135" }}>{gameState.selectedLetter}</span> should be</>
            : "Tap any empty tile to decode it"
          }
        </p>
      )}

      {/* Cipher text display */}
      <div
        className="overflow-hidden rounded-2xl p-3 sm:p-4"
        style={{
          background: "rgba(245,237,232,0.5)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
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
          correctLetters={correctLetters}
          onLetterPick={handleLetterPick}
          onClear={handleClear}
          onClose={handleCloseKeyboard}
        />
      )}

      {/* Hint button */}
      {!gameState.isComplete && gameState.hintsUsed < MAX_HINTS && (
        <GameButton onClick={handleHint} variant="outline">
          💡 Use a hint ({MAX_HINTS - gameState.hintsUsed} remaining)
        </GameButton>
      )}

      {/* Victory */}
      <AnimatePresence>
        {gameState.isComplete && (
          <div ref={resultRef} className="mt-6 space-y-3">
            <QuoteReveal plaintext={puzzle.plaintext} author={puzzle.author} />

            <GameResultCard
              emoji={gameState.hintsUsed === 0 ? "🏆" : "🎉"}
              heading={gameState.hintsUsed === 0 ? "Perfect decode!" : "Decoded!"}
              subtext={
                gameState.hintsUsed === 0
                  ? "No hints used — impressive!"
                  : `${gameState.hintsUsed} hint${gameState.hintsUsed !== 1 ? "s" : ""} used`
              }
              timeSeconds={gameState.endTime
                ? Math.floor((gameState.endTime - gameState.startTime) / 1000)
                : undefined}
            />

            <GameButton onClick={handleShare} variant="accent">
              {copied ? "✓ Copied!" : "📋 Share Result"}
            </GameButton>

            {onPlayAgain && (
              <GameButton onClick={onPlayAgain} variant="secondary">
                🔄 Play Again
              </GameButton>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
