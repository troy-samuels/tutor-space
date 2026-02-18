"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import SentenceDisplay from "./SentenceDisplay";
import OptionButton from "./OptionButton";
import type { OptionState } from "./OptionButton";
import ExplanationPanel from "./ExplanationPanel";
import GameProgressBar from "@/components/games/engine/GameProgressBar";
import GameResultCard from "@/components/games/engine/GameResultCard";
import GameButton from "@/components/games/engine/GameButton";
import { recordGamePlay } from "@/lib/games/streaks";
import { haptic } from "@/lib/games/haptics";
import { shareResult } from "@/components/games/engine/share";
import { fireConfetti } from "@/lib/games/juice";
import type {
  MissingPiecePuzzle,
  MissingPieceGameState,
} from "@/lib/games/data/missing-piece/types";

interface MissingPieceGameProps {
  puzzle: MissingPiecePuzzle;
  onGameEnd?: (state: MissingPieceGameState) => void;
  onPlayAgain?: () => void;
}

const MAX_LIVES = 3;

export default function MissingPieceGame({ puzzle, onGameEnd, onPlayAgain }: MissingPieceGameProps) {
  const sentenceCount = puzzle.sentences.length;

  const [gameState, setGameState] = React.useState<MissingPieceGameState>({
    puzzle,
    currentSentence: 0,
    score: 0,
    lives: MAX_LIVES,
    maxLives: MAX_LIVES,
    isComplete: false,
    isWon: false,
    startTime: Date.now(),
    sentenceResults: Array(sentenceCount).fill(null),
  });

  const [optionStates, setOptionStates] = React.useState<
    [OptionState, OptionState, OptionState, OptionState]
  >(["default", "default", "default", "default"]);
  const [showExplanation, setShowExplanation] = React.useState(false);
  const [lastGuessCorrect, setLastGuessCorrect] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [showAllExplanations, setShowAllExplanations] = React.useState(false);

  // Proper cleanup ref for copy timeout
  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  // Stable ref to latest onGameEnd callback + single-fire guard
  const onGameEndRef = React.useRef(onGameEnd);
  React.useEffect(() => { onGameEndRef.current = onGameEnd; });
  const hasNotifiedRef = React.useRef(false);

  // Notify parent when game ends (fires exactly once)
  React.useEffect(() => {
    if (!gameState.isComplete || hasNotifiedRef.current) return;
    hasNotifiedRef.current = true;
    onGameEndRef.current?.(gameState);
  }, [gameState]);

  // Victory confetti on win
  React.useEffect(() => {
    if (!gameState.isComplete || !gameState.isWon) return;
    void fireConfetti({
      particleCount: 60,
      spread: 80,
      startVelocity: 30,
      gravity: 0.8,
      ticks: 80,
      origin: { y: 0.5 },
      colors: ["#D36135", "#3E5641", "#D4A843", "#FFFFFF"],
    });
  }, [gameState.isComplete, gameState.isWon]);

  const currentSentence = puzzle.sentences[gameState.currentSentence];
  const progress = gameState.currentSentence / sentenceCount;

  const handleOptionTap = React.useCallback(
    (tappedIndex: number) => {
      if (gameState.isComplete || showExplanation || !currentSentence) return;

      const isCorrect = tappedIndex === currentSentence.correctIndex;

      const newStates: [OptionState, OptionState, OptionState, OptionState] = [
        "disabled", "disabled", "disabled", "disabled",
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
      haptic(isCorrect ? "success" : "error");

      setGameState((prev) => {
        const newResults = [...prev.sentenceResults];
        newResults[prev.currentSentence] = isCorrect;
        const newScore = isCorrect ? prev.score + 1 : prev.score;
        const newLives = isCorrect ? prev.lives : prev.lives - 1;
        const isLastSentence = prev.currentSentence >= sentenceCount - 1;
        const isGameOver = newLives <= 0 || isLastSentence;
        const isWon = isGameOver && newLives > 0;

        if (isWon) recordGamePlay("missing-piece");

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
    [gameState.isComplete, showExplanation, currentSentence, sentenceCount],
  );

  const handleNextSentence = React.useCallback(() => {
    setShowExplanation(false);
    setOptionStates(["default", "default", "default", "default"]);
    setGameState((prev) => ({ ...prev, currentSentence: prev.currentSentence + 1 }));
  }, []);

  // Auto-advance after 2.5s on correct answer
  React.useEffect(() => {
    if (!showExplanation || gameState.isComplete || !lastGuessCorrect) return;
    const timer = setTimeout(() => {
      handleNextSentence();
    }, 2500);
    return () => clearTimeout(timer);
  }, [showExplanation, gameState.isComplete, lastGuessCorrect, handleNextSentence]);

  const generateShareText = React.useCallback((): string => {
    const langFlag = puzzle.language === "fr" ? "🇫🇷" : puzzle.language === "de" ? "🇩🇪" : "🇪🇸";
    const elapsed = gameState.endTime
      ? Math.floor((gameState.endTime - gameState.startTime) / 1000) : 0;
    const timeStr = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;
    return [
      `Missing Piece #${puzzle.number} ${langFlag}`,
      `${gameState.score}/${sentenceCount} · ${gameState.lives}● remaining · ${timeStr}`,
      "",
      "tutorlingua.co/games/missing-piece",
    ].join("\n");
  }, [puzzle.number, puzzle.language, sentenceCount, gameState]);

  const handleShare = React.useCallback(async () => {
    const text = generateShareText();
    await shareResult(text, "Missing Piece", setCopied, copyTimeoutRef);
  }, [generateShareText]);

  const timeSeconds = gameState.endTime
    ? Math.floor((gameState.endTime - gameState.startTime) / 1000)
    : undefined;

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <GameProgressBar
        label={`Sentence ${Math.min(gameState.currentSentence + 1, sentenceCount)}/${sentenceCount}`}
        progress={progress}
        lives={gameState.lives}
        maxLives={MAX_LIVES}
      />

      {/* Current sentence */}
      <AnimatePresence mode="wait">
        {!gameState.isComplete && currentSentence && (
          <motion.div
            key={gameState.currentSentence}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="space-y-4"
          >
            <SentenceDisplay
              sentence={currentSentence.sentence}
              category={currentSentence.category}
              difficulty={currentSentence.difficulty}
            />

            {/* Options */}
            <div className="grid grid-cols-2 gap-2.5 w-full">
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

            <AnimatePresence>
              {showExplanation && (
                <ExplanationPanel
                  isCorrect={lastGuessCorrect}
                  correctAnswer={currentSentence.options[currentSentence.correctIndex]}
                  explanation={currentSentence.explanation}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showExplanation && !gameState.isComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, type: "spring", stiffness: 300, damping: 25 }}
                >
                  <GameButton onClick={handleNextSentence} variant="primary">
                    Next Sentence →
                  </GameButton>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* End of game */}
      <AnimatePresence>
        {gameState.isComplete && (
          <div className="mt-4 space-y-3">
            <GameResultCard
              emoji={gameState.isWon ? "🎉" : "💪"}
              heading={gameState.isWon ? "Brilliant!" : "Good effort!"}
              subtext={`${gameState.score}/${sentenceCount} correct · ${gameState.lives} ${gameState.lives === 1 ? "life" : "lives"} remaining`}
              timeSeconds={timeSeconds}
            />

            <GameButton onClick={handleShare} variant="accent">
              {copied ? "✓ Copied!" : "📋 Share Result"}
            </GameButton>

            <GameButton
              onClick={() => setShowAllExplanations((p) => !p)}
              variant="outline"
            >
              {showAllExplanations ? "Hide Explanations" : "Review All Sentences"}
            </GameButton>

            {/* Play Again */}
            {onPlayAgain && (
              <GameButton onClick={onPlayAgain} variant="secondary">
                🔄 Play Again
              </GameButton>
            )}

            <AnimatePresence>
              {showAllExplanations && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2.5 overflow-hidden"
                >
                  {puzzle.sentences.map((sent, i) => (
                    <div
                      key={`sent-${i}`}
                      className="rounded-xl border p-4"
                      style={
                        gameState.sentenceResults[i] === true
                          ? { background: "rgba(62,86,65,0.07)", borderColor: "rgba(62,86,65,0.20)" }
                          : gameState.sentenceResults[i] === false
                            ? { background: "rgba(162,73,54,0.07)", borderColor: "rgba(162,73,54,0.20)" }
                            : { background: "rgba(0,0,0,0.02)", borderColor: "rgba(0,0,0,0.06)" }
                      }
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {gameState.sentenceResults[i] === true ? "✅"
                            : gameState.sentenceResults[i] === false ? "❌" : "⚪"}
                        </span>
                        <h4 className="text-sm font-bold" style={{ color: "#2D2A26" }}>
                          #{i + 1}: {sent.options[sent.correctIndex]}
                        </h4>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: "#6B6560" }}>
                        {sent.sentence.replace("___", `[${sent.options[sent.correctIndex]}]`)}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: "#6B6560" }}>
                        {sent.explanation}
                      </p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
