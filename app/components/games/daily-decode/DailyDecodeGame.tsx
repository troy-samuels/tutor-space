"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
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

export default function DailyDecodeGame({ puzzle, onGameEnd, onPlayAgain }: DailyDecodeGameProps) {
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
  const [showInlineHint, setShowInlineHint] = React.useState(true);

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

  // Victory confetti on win
  React.useEffect(() => {
    if (!gameState.isComplete || !gameState.isWon) return;
    void fireConfetti({
      particleCount: 65,
      spread: 85,
      startVelocity: 30,
      gravity: 0.8,
      ticks: 85,
      origin: { y: 0.5 },
      colors: ["#D36135", "#3E5641", "#D4A843", "#FFFFFF", "#5A8AB5"],
    });
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

        // Set new mapping
        newMappings[prev.selectedLetter!] = letter;

        // Check if this guess is wrong
        const expectedPlain = prev.cipher.decrypt[prev.selectedLetter!];
        const isWrong = expectedPlain && letter.toUpperCase() !== expectedPlain;
        const newMistakes = isWrong ? prev.mistakes + 1 : prev.mistakes;

        if (isWrong) haptic("error");
        else haptic("tap");

        // Hide inline hint after first mapping
        setShowInlineHint(false);

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
    await shareResult(text, "Daily Decode", setCopied, copyTimeoutRef);
  }, [gameState, puzzle]);

  return (
    <div className="space-y-4">
      {/* Difficulty & hints bar — glanceable */}
      <div className="flex items-center justify-center gap-4">
        <span
          className="rounded-full border px-3 py-0.5 text-xs font-medium capitalize"
          style={{ color: "#6B6560", borderColor: "rgba(0,0,0,0.10)" }}
        >
          {puzzle.difficulty === "easy" ? "Easy 🟢" : puzzle.difficulty === "medium" ? "Medium 🟡" : "Hard 🔴"}
        </span>
        <span className="text-xs tabular-nums" style={{ color: "#9C9590" }}>
          💡 {gameState.hintsUsed}/{MAX_HINTS} hints
        </span>
      </div>

      {/* Inline helper hint — fades after first mapping */}
      <AnimatePresence>
        {showInlineHint && !gameState.isComplete && (
          <motion.p
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-xs text-center"
            style={{ color: "var(--game-text-muted)" }}
          >
            Tap any letter below, then type what you think it really is
          </motion.p>
        )}
      </AnimatePresence>

      {/* Cipher text display */}
      <div
        className="rounded-2xl p-3"
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
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
            className="mt-4 space-y-4"
          >
            {/* Quote reveal */}
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

            {/* Play Again */}
            {onPlayAgain && (
              <GameButton onClick={onPlayAgain} variant="secondary">
                🔄 Play Again
              </GameButton>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
