"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import WordCard from "./WordCard";
import type { CardState } from "./WordCard";
import RoundResult from "./RoundResult";
import ProgressBar from "./ProgressBar";
import { recordGamePlay } from "@/lib/games/streaks";
import { haptic } from "@/lib/games/haptics";
import { cn } from "@/lib/utils";
import type { OddOneOutPuzzle, OddOneOutGameState } from "@/lib/games/data/odd-one-out/types";

interface OddOneOutGameProps {
  puzzle: OddOneOutPuzzle;
  onGameEnd?: (state: OddOneOutGameState) => void;
}

const MAX_LIVES = 3;
const TOTAL_ROUNDS = 10;

export default function OddOneOutGame({ puzzle, onGameEnd }: OddOneOutGameProps) {
  const [gameState, setGameState] = React.useState<OddOneOutGameState>({
    puzzle,
    currentRound: 0,
    score: 0,
    lives: MAX_LIVES,
    maxLives: MAX_LIVES,
    isComplete: false,
    isWon: false,
    startTime: Date.now(),
    roundResults: Array(TOTAL_ROUNDS).fill(null),
  });

  const [cardStates, setCardStates] = React.useState<[CardState, CardState, CardState, CardState]>([
    "default",
    "default",
    "default",
    "default",
  ]);
  const [showResult, setShowResult] = React.useState(false);
  const [lastGuessCorrect, setLastGuessCorrect] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [showExplanations, setShowExplanations] = React.useState(false);

  // Notify parent when game ends
  React.useEffect(() => {
    if (gameState.isComplete && onGameEnd) {
      onGameEnd(gameState);
    }
  }, [gameState.isComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentRound = puzzle.rounds[gameState.currentRound];

  const handleCardTap = React.useCallback(
    (tappedIndex: number) => {
      if (gameState.isComplete || showResult || !currentRound) return;

      const isCorrect = tappedIndex === currentRound.oddIndex;

      // Set card visual states
      const newStates: [CardState, CardState, CardState, CardState] = [
        "default",
        "default",
        "default",
        "default",
      ];

      if (isCorrect) {
        newStates[tappedIndex] = "correct";
        // Mark the other 3 as revealed
        for (let i = 0; i < 4; i++) {
          if (i !== tappedIndex) newStates[i] = "revealed";
        }
      } else {
        newStates[tappedIndex] = "wrong";
        // Show the actual odd one out
        newStates[currentRound.oddIndex] = "correct";
      }

      setCardStates(newStates);
      setLastGuessCorrect(isCorrect);
      setShowResult(true);
      haptic(isCorrect ? "success" : "error");

      setGameState((prev) => {
        const newResults = [...prev.roundResults];
        newResults[prev.currentRound] = isCorrect;
        const newScore = isCorrect ? prev.score + 1 : prev.score;
        const newLives = isCorrect ? prev.lives : prev.lives - 1;

        // Check if game is over
        const isLastRound = prev.currentRound >= TOTAL_ROUNDS - 1;
        const isGameOver = newLives <= 0 || isLastRound;
        const isWon = isGameOver && newLives > 0;

        if (isWon) {
          recordGamePlay("odd-one-out");
        }

        return {
          ...prev,
          score: newScore,
          lives: newLives,
          roundResults: newResults,
          isComplete: isGameOver,
          isWon,
          endTime: isGameOver ? Date.now() : undefined,
        };
      });
    },
    [gameState.isComplete, showResult, currentRound],
  );

  const handleNextRound = React.useCallback(() => {
    setShowResult(false);
    setCardStates(["default", "default", "default", "default"]);
    setGameState((prev) => ({
      ...prev,
      currentRound: prev.currentRound + 1,
    }));
  }, []);

  const generateShareText = React.useCallback((): string => {
    const langFlag =
      puzzle.language === "fr" ? "🇫🇷" : puzzle.language === "de" ? "🇩🇪" : "🇪🇸";

    const elapsed = gameState.endTime
      ? Math.floor((gameState.endTime - gameState.startTime) / 1000)
      : 0;
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = `⏱ ${minutes}:${seconds.toString().padStart(2, "0")}`;

    const livesLeft = gameState.lives;
    const hearts = "❤️".repeat(livesLeft);

    // Build result row
    const resultIcons = gameState.roundResults
      .map((r) => (r === true ? "🟢" : r === false ? "🔴" : "⚪"))
      .join("");

    return [
      `Odd One Out #${puzzle.number} ${langFlag}`,
      `${gameState.score}/${TOTAL_ROUNDS} · ${livesLeft} ${hearts} remaining · ${timeStr}`,
      "",
      resultIcons,
      "",
      "tutorlingua.co/games/odd-one-out",
    ].join("\n");
  }, [puzzle.number, puzzle.language, gameState]);

  const handleShare = React.useCallback(async () => {
    const text = generateShareText();
    try {
      if (navigator.share) {
        await navigator.share({ title: "Odd One Out", text });
        return;
      }
    } catch {
      // fallthrough to clipboard
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generateShareText]);

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <ProgressBar
        currentRound={gameState.currentRound}
        totalRounds={TOTAL_ROUNDS}
        lives={gameState.lives}
        maxLives={MAX_LIVES}
      />

      {/* Score */}
      <div className="flex justify-center">
        <span className="text-xs text-muted-foreground">
          Score: {gameState.score}/{TOTAL_ROUNDS}
        </span>
      </div>

      {/* Current round */}
      <AnimatePresence mode="wait">
        {!gameState.isComplete && currentRound && (
          <motion.div
            key={gameState.currentRound}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Instruction */}
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Find the word that doesn&apos;t belong
            </p>

            {/* 2x2 Word Grid — full width */}
            <div className="grid grid-cols-2 gap-2">
              {currentRound.words.map((word, i) => (
                <WordCard
                  key={`${gameState.currentRound}-${i}`}
                  word={word}
                  state={cardStates[i]}
                  onClick={() => handleCardTap(i)}
                  disabled={gameState.isComplete || showResult}
                />
              ))}
            </div>

            {/* Round result explanation */}
            <div className="mt-4">
              <AnimatePresence>
                {showResult && (
                  <RoundResult
                    isCorrect={lastGuessCorrect}
                    category={currentRound.category}
                    explanation={currentRound.explanation}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Next button */}
            <AnimatePresence>
              {showResult && !gameState.isComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4"
                >
                  <Button
                    onClick={handleNextRound}
                    variant="default"
                    size="lg"
                    className="w-full rounded-xl"
                  >
                    Next Round →
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* End of game */}
      <AnimatePresence>
        {gameState.isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
            className="mt-6 space-y-4"
          >
            {/* Result banner */}
            <div className="rounded-2xl border border-border/50 bg-card p-6 text-center">
              <div className="text-4xl">{gameState.isWon ? "🎉" : "💪"}</div>
              <h2 className="mt-2 font-heading text-xl text-foreground">
                {gameState.isWon ? "Excellent!" : "Good try!"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {gameState.score}/{TOTAL_ROUNDS} correct ·{" "}
                {gameState.lives} {gameState.lives === 1 ? "life" : "lives"} remaining
              </p>

              {/* Result grid */}
              <div className="mx-auto mt-4 flex justify-center gap-0.5">
                {gameState.roundResults.map((r, i) => (
                  <span key={i} className="text-base">
                    {r === true ? "🟢" : r === false ? "🔴" : "⚪"}
                  </span>
                ))}
              </div>

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

            {/* Share */}
            <Button
              onClick={handleShare}
              variant="default"
              size="lg"
              className="w-full rounded-xl"
            >
              {copied ? "✓ Copied!" : "📋 Share Result"}
            </Button>

            {/* Explain */}
            <Button
              onClick={() => setShowExplanations((prev) => !prev)}
              variant="outline"
              size="lg"
              className="w-full rounded-xl"
            >
              {showExplanations ? "Hide Explanations" : "🧠 Review All Rounds"}
            </Button>

            {/* All explanations */}
            <AnimatePresence>
              {showExplanations && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  {puzzle.rounds.map((round, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-xl border p-4",
                        gameState.roundResults[i]
                          ? "border-emerald-500/20 bg-emerald-500/5"
                          : "border-destructive/20 bg-destructive/5",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {gameState.roundResults[i] ? "✅" : "❌"}
                        </span>
                        <h4 className="text-sm font-bold text-foreground">
                          Round {i + 1}: {round.category}
                        </h4>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {round.words.join(" · ")}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {round.explanation}
                      </p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
