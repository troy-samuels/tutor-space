"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StepChain from "./StepChain";
import WordInput from "./WordInput";
import { recordGamePlay } from "@/lib/games/streaks";
import { validateStep, generateShareText, SUPPORTED_GAME_LANGUAGES } from "@/lib/games/data/word-ladder";
import { haptic } from "@/lib/games/haptics";
import { cn } from "@/lib/utils";
import type { WordLadderPuzzle, WordLadderGameState } from "@/lib/games/data/word-ladder/types";

interface WordLadderGameProps {
  puzzle: WordLadderPuzzle;
  onGameEnd?: (state: { isComplete: boolean; isWon: boolean; mistakes: number }) => void;
}

export default function WordLadderGame({ puzzle, onGameEnd }: WordLadderGameProps) {
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
    try {
      if (navigator.share) {
        await navigator.share({ title: "Word Ladder", text });
        return;
      }
    } catch {
      // fallthrough to clipboard
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [gameState, puzzle]);

  return (
    <div className="space-y-6">
      {/* Par info */}
      <div className="flex items-center justify-center gap-3">
        <Badge variant="outline" className="gap-1 text-xs">
          ⛳ Par: {puzzle.par} steps
        </Badge>
        <Badge variant="outline" className="gap-1 text-xs">
          📝 Steps: {gameState.steps.length}
        </Badge>
      </div>

      {/* Step Chain */}
      <StepChain
        startWord={puzzle.startWord}
        steps={gameState.steps}
        targetWord={puzzle.targetWord}
        isComplete={gameState.isComplete}
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
                <div className="rounded-xl border border-primary/20 bg-primary/[0.06] px-4 py-3 backdrop-blur-md">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-sm">💡</span>
                    <p className="text-sm italic text-foreground/80">{puzzle.hint}</p>
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHint(true)}
                  className="w-full rounded-xl text-xs text-muted-foreground hover:text-primary"
                >
                  💡 Need a hint?
                </Button>
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
            <div className="rounded-2xl border border-border/50 bg-card p-6 text-center">
              <div className="text-4xl">
                {gameState.steps.length <= puzzle.par ? "🏆" : "🎉"}
              </div>
              <h2 className="mt-2 font-heading text-xl text-foreground">
                {gameState.steps.length <= puzzle.par
                  ? "Under par!"
                  : gameState.steps.length === puzzle.par + 1
                    ? "Close to par!"
                    : "Solved!"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {gameState.steps.length} step{gameState.steps.length !== 1 ? "s" : ""} (par {puzzle.par})
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

            {/* Show optimal path */}
            <Button
              onClick={() => setShowOptimalPath((prev) => !prev)}
              variant="outline"
              size="lg"
              className="w-full rounded-xl"
            >
              {showOptimalPath ? "Hide Optimal Path" : "🧠 Show Optimal Path"}
            </Button>

            <AnimatePresence>
              {showOptimalPath && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl border border-border/50 bg-card/50 p-4">
                    <h4 className="text-sm font-bold text-foreground">
                      ⛳ Optimal Path ({puzzle.par} steps)
                    </h4>
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      {puzzle.optimalPath.map((word, i) => (
                        <React.Fragment key={i}>
                          <span className={cn(
                            "rounded-md px-2 py-1 font-mono text-xs font-semibold",
                            i === 0
                              ? "bg-[#A0C35A]/15 text-[#A0C35A]"
                              : i === puzzle.optimalPath.length - 1
                                ? "bg-[#F9DF6D]/15 text-[#F9DF6D]"
                                : "bg-white/[0.06] text-foreground",
                          )}>
                            {word}
                          </span>
                          {i < puzzle.optimalPath.length - 1 && (
                            <span className="text-muted-foreground/40">→</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
