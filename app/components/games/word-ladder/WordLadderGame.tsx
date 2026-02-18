"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import StepChain from "./StepChain";
import WordInput from "./WordInput";
import GameResultCard from "@/components/games/engine/GameResultCard";
import GameButton from "@/components/games/engine/GameButton";
import { recordGamePlay } from "@/lib/games/streaks";
import { validateStep, generateShareText } from "@/lib/games/data/word-ladder";
import { haptic } from "@/lib/games/haptics";
import { shareResult } from "@/components/games/engine/share";
import { fireConfetti } from "@/lib/games/juice";
import type { WordLadderPuzzle, WordLadderGameState } from "@/lib/games/data/word-ladder/types";

interface WordLadderGameProps {
  puzzle: WordLadderPuzzle;
  onGameEnd?: (state: { isComplete: boolean; isWon: boolean; mistakes: number }) => void;
  onPlayAgain?: () => void;
}

export default function WordLadderGame({ puzzle, onGameEnd, onPlayAgain }: WordLadderGameProps) {
  const [gameState, setGameState] = React.useState<WordLadderGameState>(() => ({
    puzzle,
    steps: [],
    currentInput: "",
    error: null,
    isComplete: false,
    isWon: false,
    mistakes: 0,
    startTime: Date.now(),
  }));

  const [showHint, setShowHint] = React.useState(false);
  const [showOptimalPath, setShowOptimalPath] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Proper cleanup ref — prevents memory leak on unmount
  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    return () => { if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current); };
  }, []);

  // Stable ref to latest onGameEnd callback + single-fire guard
  const onGameEndRef = React.useRef(onGameEnd);
  React.useEffect(() => { onGameEndRef.current = onGameEnd; });
  const hasNotifiedRef = React.useRef(false);

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
      particleCount: 70,
      spread: 90,
      startVelocity: 32,
      gravity: 0.75,
      ticks: 90,
      origin: { y: 0.5 },
      colors: ["#D36135", "#3E5641", "#D4A843", "#FFFFFF", "#5A8AB5"],
    });
  }, [gameState.isComplete, gameState.isWon]);

  // Clear error after a delay
  React.useEffect(() => {
    if (!gameState.error) return;
    const timer = setTimeout(() => {
      setGameState((prev) => ({ ...prev, error: null }));
    }, 2000);
    return () => clearTimeout(timer);
  }, [gameState.error]);

  const lastWord = gameState.steps.length > 0
    ? gameState.steps[gameState.steps.length - 1]
    : puzzle.startWord;

  const handleInputChange = React.useCallback((value: string) => {
    setGameState((prev) => ({ ...prev, currentInput: value, error: null }));
  }, []);

  const handleUndo = React.useCallback(() => {
    if (gameState.steps.length === 0 || gameState.isComplete) return;
    haptic("tap");
    setGameState((prev) => ({
      ...prev,
      steps: prev.steps.slice(0, -1),
      currentInput: "",
      error: null,
    }));
  }, [gameState.steps.length, gameState.isComplete]);

  const handleSubmit = React.useCallback(() => {
    const { currentInput } = gameState;
    if (!currentInput) return;

    const upper = currentInput.toUpperCase();

    // Don't allow submitting the same word
    if (upper === lastWord) {
      setGameState((prev) => ({
        ...prev,
        error: "That's the current word!",
        mistakes: prev.mistakes + 1,
      }));
      return;
    }

    // Validate the step
    const result = validateStep(lastWord, upper, puzzle.validWords);

    if (!result.valid) {
      haptic("error");
      setGameState((prev) => ({
        ...prev,
        error: result.error || "Invalid word",
        mistakes: prev.mistakes + 1,
      }));
      return;
    }

    // Valid step! Check if we've reached the target
    const isWin = upper === puzzle.targetWord;

    setGameState((prev) => {
      const newSteps = [...prev.steps, upper];
      const newState: WordLadderGameState = {
        ...prev,
        steps: newSteps,
        currentInput: "",
        error: null,
        isComplete: isWin,
        isWon: isWin,
        endTime: isWin ? Date.now() : undefined,
      };
      return newState;
    });

    if (isWin) {
      haptic("success");
      recordGamePlay("word-ladder");
    } else {
      haptic("tap");
    }
  }, [gameState, lastWord, puzzle]);

  const handleShare = React.useCallback(async () => {
    const timeMs = (gameState.endTime || Date.now()) - gameState.startTime;
    const text = generateShareText(
      puzzle.number,
      puzzle.language,
      gameState.steps.length,
      puzzle.par,
      timeMs,
    );
    await shareResult(text, "Word Ladder", setCopied, copyTimeoutRef);
  }, [gameState, puzzle]);

  return (
    <div className="space-y-4">
      {/* Par info — glanceable status row */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-base">⛳</span>
          <span className="text-sm font-medium tabular-nums" style={{ color: "#6B6560" }}>
            Par {puzzle.par}
          </span>
        </div>
        <div
          className="h-4 w-px"
          style={{ background: "rgba(0,0,0,0.12)" }}
        />
        <div className="flex items-center gap-1.5">
          <span className="text-base">📝</span>
          <span className="text-sm font-semibold tabular-nums" style={{ color: "#2D2A26" }}>
            {gameState.steps.length} {gameState.steps.length === 1 ? "step" : "steps"}
          </span>
        </div>
      </div>

      {/* Step Chain */}
      <StepChain
        startWord={puzzle.startWord}
        steps={gameState.steps}
        targetWord={puzzle.targetWord}
        isComplete={gameState.isComplete}
        par={puzzle.par}
      />

      {/* Input area */}
      {!gameState.isComplete && (
        <WordInput
          value={gameState.currentInput}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          maxLength={puzzle.startWord.length}
          error={gameState.error}
          disabled={gameState.isComplete}
          lastWord={lastWord}
          leftSlot={
            gameState.steps.length > 0 ? (
              <GameButton
                onClick={handleUndo}
                variant="outline"
                fullWidth={false}
                className="px-3 min-w-[48px] flex-shrink-0"
                aria-label="Undo last step"
              >
                ↩
              </GameButton>
            ) : undefined
          }
        />
      )}

      {/* Hint button */}
      {!gameState.isComplete && puzzle.hint && (
        <div className="mt-2">
          <AnimatePresence mode="wait">
            {showHint ? (
              <motion.div
                key="hint-text"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div
                  className="rounded-xl px-4 py-3"
                  style={{
                    background: "rgba(211,97,53,0.06)",
                    border: "1px solid rgba(211,97,53,0.20)",
                  }}
                >
                  <div className="flex items-start gap-2">
                    <p className="text-sm italic" style={{ color: "#6B6560" }}>
                      {puzzle.hint}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="hint-button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <GameButton
                  onClick={() => setShowHint(true)}
                  variant="outline"
                >
                  💡 Need a hint?
                </GameButton>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Victory / Result */}
      <AnimatePresence>
        {gameState.isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
            className="mt-6 space-y-4"
          >
            <GameResultCard
              emoji={gameState.steps.length <= puzzle.par ? "⛳" : "🎉"}
              heading={
                gameState.steps.length <= puzzle.par
                  ? "Under par!"
                  : gameState.steps.length === puzzle.par + 1
                    ? "Close to par!"
                    : "Solved!"
              }
              subtext={`${gameState.steps.length} step${gameState.steps.length !== 1 ? "s" : ""} · par ${puzzle.par}`}
              timeSeconds={gameState.endTime
                ? Math.floor((gameState.endTime - gameState.startTime) / 1000)
                : undefined}
            />

            <GameButton onClick={handleShare} variant="accent">
              {copied ? "✓ Copied!" : "📋 Share Result"}
            </GameButton>

            <GameButton
              onClick={() => setShowOptimalPath((prev) => !prev)}
              variant="outline"
            >
              {showOptimalPath ? "Hide Optimal Path" : "Show Optimal Path"}
            </GameButton>

            <AnimatePresence>
              {showOptimalPath && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    className="rounded-xl p-4"
                    style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
                  >
                    <h4 className="text-sm font-bold" style={{ color: "#2D2A26" }}>
                      ⛳ Optimal Path ({puzzle.par} steps)
                    </h4>
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      {puzzle.optimalPath.map((word, i) => (
                        <React.Fragment key={`path-${word}-${i}`}>
                          <span
                            className="rounded-md px-2 py-1 font-mono text-xs font-semibold"
                            style={
                              i === 0
                                ? { background: "rgba(62,86,65,0.12)", color: "#3E5641" }
                                : i === puzzle.optimalPath.length - 1
                                  ? { background: "rgba(212,168,67,0.15)", color: "#D4A843" }
                                  : { background: "rgba(0,0,0,0.04)", color: "#2D2A26" }
                            }
                          >
                            {word}
                          </span>
                          {i < puzzle.optimalPath.length - 1 && (
                            <span style={{ color: "rgba(156,149,144,0.6)" }}>→</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Play Again — always last */}
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
