"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import SentenceDisplay from "./SentenceDisplay";
import OptionButton from "./OptionButton";
import type { OptionState } from "./OptionButton";
import ExplanationPanel from "./ExplanationPanel";
import { recordGamePlay } from "@/lib/games/streaks";
import { cn } from "@/lib/utils";
import type {
  MissingPiecePuzzle,
  MissingPieceGameState,
} from "@/lib/games/data/missing-piece/types";

interface MissingPieceGameProps {
  puzzle: MissingPiecePuzzle;
  onGameEnd?: (state: MissingPieceGameState) => void;
}

const MAX_LIVES = 3;
const TOTAL_SENTENCES = 15;

export default function MissingPieceGame({ puzzle, onGameEnd }: MissingPieceGameProps) {
  const [gameState, setGameState] = React.useState<MissingPieceGameState>({
    puzzle,
    currentSentence: 0,
    score: 0,
    lives: MAX_LIVES,
    maxLives: MAX_LIVES,
    isComplete: false,
    isWon: false,
    startTime: Date.now(),
    sentenceResults: Array(TOTAL_SENTENCES).fill(null),
  });

  const [optionStates, setOptionStates] = React.useState<
    [OptionState, OptionState, OptionState, OptionState]
  >(["default", "default", "default", "default"]);
  const [showExplanation, setShowExplanation] = React.useState(false);
  const [lastGuessCorrect, setLastGuessCorrect] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [showAllExplanations, setShowAllExplanations] = React.useState(false);

  // Notify parent when game ends
  React.useEffect(() => {
    if (gameState.isComplete && onGameEnd) {
      onGameEnd(gameState);
    }
  }, [gameState.isComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentSentence = puzzle.sentences[gameState.currentSentence];

  const handleOptionTap = React.useCallback(
    (tappedIndex: number) => {
      if (gameState.isComplete || showExplanation || !currentSentence) return;

      const isCorrect = tappedIndex === currentSentence.correctIndex;

      // Set option visual states
      const newStates: [OptionState, OptionState, OptionState, OptionState] = [
        "disabled",
        "disabled",
        "disabled",
        "disabled",
      ];

      if (isCorrect) {
        newStates[tappedIndex] = "correct";
      } else {
        newStates[tappedIndex] = "wrong";
        newStates[currentSentence.correctIndex] = "correct";
      }

      setOptionStates(newStates);
      setLastGuessCorrect(isCorrect);
      setShowExplanation(true);

      setGameState((prev) => {
        const newResults = [...prev.sentenceResults];
        newResults[prev.currentSentence] = isCorrect;
        const newScore = isCorrect ? prev.score + 1 : prev.score;
        const newLives = isCorrect ? prev.lives : prev.lives - 1;

        const sentenceCount = puzzle.sentences.length;
        const isLastSentence = prev.currentSentence >= sentenceCount - 1;
        const isGameOver = newLives <= 0 || isLastSentence;
        const isWon = isGameOver && newLives > 0;

        if (isWon) {
          recordGamePlay("missing-piece");
        }

        return {
          ...prev,
          score: newScore,
          lives: newLives,
          sentenceResults: newResults,
          isComplete: isGameOver,
          isWon,
          endTime: isGameOver ? Date.now() : undefined,
        };
      });
    },
    [gameState.isComplete, showExplanation, currentSentence, puzzle.sentences.length],
  );

  const handleNextSentence = React.useCallback(() => {
    setShowExplanation(false);
    setOptionStates(["default", "default", "default", "default"]);
    setGameState((prev) => ({
      ...prev,
      currentSentence: prev.currentSentence + 1,
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

    const sentenceCount = puzzle.sentences.length;

    return [
      `Missing Piece #${puzzle.number} ${langFlag}`,
      `${gameState.score}/${sentenceCount} · ${livesLeft} ${hearts} remaining · ${timeStr}`,
      "",
      "tutorlingua.co/games/missing-piece",
    ].join("\n");
  }, [puzzle.number, puzzle.language, puzzle.sentences.length, gameState]);

  const handleShare = React.useCallback(async () => {
    const text = generateShareText();
    try {
      if (navigator.share) {
        await navigator.share({ title: "Missing Piece", text });
        return;
      }
    } catch {
      // fallthrough to clipboard
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generateShareText]);

  const sentenceCount = puzzle.sentences.length;
  const progress = (gameState.currentSentence / sentenceCount) * 100;

  return (
    <div className="space-y-4">
      {/* Progress + Lives */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Sentence {Math.min(gameState.currentSentence + 1, sentenceCount)}/{sentenceCount}
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <motion.span
                key={i}
                initial={false}
                animate={{
                  scale: i >= gameState.lives ? 0.8 : 1,
                  opacity: i >= gameState.lives ? 0.3 : 1,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="text-sm"
              >
                {i < gameState.lives ? "❤️" : "🖤"}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
            className={cn(
              "h-full rounded-full",
              gameState.lives === MAX_LIVES
                ? "bg-emerald-500"
                : gameState.lives >= 2
                  ? "bg-primary"
                  : "bg-amber-500",
            )}
          />
        </div>
      </div>

      {/* Score */}
      <div className="flex justify-center">
        <span className="text-xs text-muted-foreground">
          Score: {gameState.score}/{sentenceCount}
        </span>
      </div>

      {/* Current sentence */}
      <AnimatePresence mode="wait">
        {!gameState.isComplete && currentSentence && (
          <motion.div
            key={gameState.currentSentence}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="space-y-4"
          >
            {/* Sentence with blank */}
            <SentenceDisplay
              sentence={currentSentence.sentence}
              category={currentSentence.category}
              difficulty={currentSentence.difficulty}
            />

            {/* Options */}
            <div className="grid grid-cols-2 gap-2">
              {currentSentence.options.map((option, i) => (
                <OptionButton
                  key={`${gameState.currentSentence}-${i}`}
                  text={option}
                  state={optionStates[i]}
                  onClick={() => handleOptionTap(i)}
                  disabled={gameState.isComplete || showExplanation}
                  index={i}
                />
              ))}
            </div>

            {/* Explanation */}
            <AnimatePresence>
              {showExplanation && (
                <ExplanationPanel
                  isCorrect={lastGuessCorrect}
                  correctAnswer={currentSentence.options[currentSentence.correctIndex]}
                  explanation={currentSentence.explanation}
                />
              )}
            </AnimatePresence>

            {/* Next button */}
            <AnimatePresence>
              {showExplanation && !gameState.isComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    onClick={handleNextSentence}
                    variant="default"
                    size="lg"
                    className="w-full rounded-xl"
                  >
                    Next Sentence →
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
                {gameState.isWon ? "Brilliant!" : "Good effort!"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {gameState.score}/{sentenceCount} correct ·{" "}
                {gameState.lives} {gameState.lives === 1 ? "life" : "lives"} remaining
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

            {/* Share */}
            <Button
              onClick={handleShare}
              variant="default"
              size="lg"
              className="w-full rounded-xl"
            >
              {copied ? "✓ Copied!" : "📋 Share Result"}
            </Button>

            {/* Review all */}
            <Button
              onClick={() => setShowAllExplanations((prev) => !prev)}
              variant="outline"
              size="lg"
              className="w-full rounded-xl"
            >
              {showAllExplanations ? "Hide Explanations" : "🧠 Review All Sentences"}
            </Button>

            {/* All explanations */}
            <AnimatePresence>
              {showAllExplanations && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  {puzzle.sentences.map((sent, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-xl border p-4",
                        gameState.sentenceResults[i]
                          ? "border-emerald-500/20 bg-emerald-500/5"
                          : gameState.sentenceResults[i] === false
                            ? "border-destructive/20 bg-destructive/5"
                            : "border-border/20 bg-card/50",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {gameState.sentenceResults[i] === true
                            ? "✅"
                            : gameState.sentenceResults[i] === false
                              ? "❌"
                              : "⚪"}
                        </span>
                        <h4 className="text-sm font-bold text-foreground">
                          #{i + 1}: {sent.options[sent.correctIndex]}
                        </h4>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {sent.sentence.replace("___", `[${sent.options[sent.correctIndex]}]`)}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {sent.explanation}
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
