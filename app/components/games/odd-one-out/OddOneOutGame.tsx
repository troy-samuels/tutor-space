"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SPRING } from "@/lib/games/springs";
import WordCard from "./WordCard";
import type { CardState } from "./WordCard";
import RoundResult from "./RoundResult";
import GameProgressBar from "@/components/games/engine/GameProgressBar";
import GameResultCard from "@/components/games/engine/GameResultCard";
import GameButton from "@/components/games/engine/GameButton";
import { recordGamePlay } from "@/lib/games/streaks";
import { haptic } from "@/lib/games/haptics";
import { shareResult } from "@/components/games/engine/share";
import { fireConfetti } from "@/lib/games/juice";
import { getLanguageFlag } from "@/lib/games/language-utils";
import type { OddOneOutPuzzle, OddOneOutGameState } from "@/lib/games/data/odd-one-out/types";

interface OddOneOutGameProps {
  puzzle: OddOneOutPuzzle;
  onGameEnd?: (state: OddOneOutGameState) => void;
  onPlayAgain?: () => void;
}

const MAX_LIVES = 3;
const TOTAL_ROUNDS = 10;

export default function OddOneOutGame({ puzzle, onGameEnd, onPlayAgain }: OddOneOutGameProps) {
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
    "default", "default", "default", "default",
  ]);
  const [showResult, setShowResult] = React.useState(false);
  const [lastGuessCorrect, setLastGuessCorrect] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [showExplanations, setShowExplanations] = React.useState(false);
  const resultRef = React.useRef<HTMLDivElement>(null);

  // Cleanup refs — prevent setState after unmount
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

  // Scroll result card into view when game ends
  React.useEffect(() => {
    if (!gameState.isComplete) return;
    const timer = setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 350);
    return () => clearTimeout(timer);
  }, [gameState.isComplete]);

  // Victory confetti on win — delayed to hit the emotional peak
  React.useEffect(() => {
    if (!gameState.isComplete || !gameState.isWon) return;
    const timer = setTimeout(() => {
      void fireConfetti({
        particleCount: 60,
        spread: 80,
        startVelocity: 30,
        gravity: 0.8,
        ticks: 80,
        origin: { y: 0.5 },
        colors: ["#D36135", "#3E5641", "#D4A843", "#FFFFFF"],
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [gameState.isComplete, gameState.isWon]);

  const currentRound = puzzle.rounds[gameState.currentRound];

  const handleCardTap = React.useCallback(
    (tappedIndex: number) => {
      if (gameState.isComplete || showResult || !currentRound) return;

      const isCorrect = tappedIndex === currentRound.oddIndex;

      const newStates: [CardState, CardState, CardState, CardState] = [
        "default", "default", "default", "default",
      ];
      if (isCorrect) {
        newStates[tappedIndex] = "correct";
        for (let i = 0; i < 4; i++) {
          if (i !== tappedIndex) newStates[i] = "revealed";
        }
      } else {
        newStates[tappedIndex] = "wrong";
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
        const isLastRound = prev.currentRound >= TOTAL_ROUNDS - 1;
        const isGameOver = newLives <= 0 || isLastRound;
        const isWon = isGameOver && newLives > 0;

        if (isWon) recordGamePlay("odd-one-out");

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
    setGameState((prev) => ({ ...prev, currentRound: prev.currentRound + 1 }));
  }, []);

  // Auto-advance after 1.8s on correct answer only — wrong answers
  // require manual tap so the player has time to read the explanation
  React.useEffect(() => {
    if (!showResult || gameState.isComplete || !lastGuessCorrect) return;
    const timer = setTimeout(() => {
      handleNextRound();
    }, 1800);
    return () => clearTimeout(timer);
  }, [showResult, gameState.isComplete, lastGuessCorrect, handleNextRound]);

  const generateShareText = React.useCallback((): string => {
    const langFlag = getLanguageFlag(puzzle.language);
    const elapsed = gameState.endTime
      ? Math.floor((gameState.endTime - gameState.startTime) / 1000) : 0;
    const timeStr = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;
    const emojis = gameState.roundResults
      .map((r) => (r === true ? "🟢" : r === false ? "🔴" : "⚪"));
    // Two rows of 5 for visual balance
    const row1 = emojis.slice(0, 5).join("");
    const row2 = emojis.slice(5, 10).join("");
    return [
      `Odd One Out #${puzzle.number} ${langFlag}`,
      `${gameState.score}/${TOTAL_ROUNDS} · ${gameState.lives}● remaining · ${timeStr}`,
      "",
      row1,
      row2,
      "",
      "tutorlingua.co/games/odd-one-out",
    ].join("\n");
  }, [puzzle.number, puzzle.language, gameState]);

  const handleShare = React.useCallback(async () => {
    const text = generateShareText();
    await shareResult(text, "Odd One Out", setCopied, copyTimeoutRef);
  }, [generateShareText]);

  const timeSeconds = gameState.endTime
    ? Math.floor((gameState.endTime - gameState.startTime) / 1000)
    : undefined;

  return (
    <div className="space-y-4">
      {/* Progress header + instruction subtitle */}
      <div className="space-y-1">
        <GameProgressBar
          label={`Round ${Math.min(gameState.currentRound + 1, TOTAL_ROUNDS)}/${TOTAL_ROUNDS}`}
          progress={gameState.currentRound / TOTAL_ROUNDS}
          lives={gameState.lives}
          maxLives={MAX_LIVES}
        />
        {!gameState.isComplete && (
          <p className="text-center text-xs font-medium" style={{ color: "#9C9590" }}>
            Find the word that doesn&apos;t belong
          </p>
        )}
      </div>

      {/* Current round */}
      <AnimatePresence mode="wait">
        {!gameState.isComplete && currentRound && (
          <motion.div
            key={gameState.currentRound}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0, transition: SPRING.standard }}
            exit={{ opacity: 0, x: -24, transition: { duration: 0.15, ease: "easeIn" } }}
          >

            {/* 2×2 Word Grid */}
            <div className="grid grid-cols-2 gap-2.5">
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

            {/* Round result */}
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

            {/* Next button — always shown on wrong (no auto-advance), shown briefly on correct before auto-advance */}
            <AnimatePresence>
              {showResult && !gameState.isComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...SPRING.standard, delay: lastGuessCorrect ? 0.15 : 0.4 }}
                  className="mt-4"
                >
                  <GameButton onClick={handleNextRound} variant="primary">
                    {lastGuessCorrect ? "Next Round →" : "Continue →"}
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
          <div ref={resultRef} className="mt-6 space-y-3">
            <GameResultCard
              emoji={gameState.isWon ? "🎉" : "💪"}
              heading={gameState.isWon ? "Well done!" : "Good try!"}
              subtext={`${gameState.score}/${TOTAL_ROUNDS} correct · ${gameState.lives} ${gameState.lives === 1 ? "life" : "lives"} remaining`}
              timeSeconds={timeSeconds}
            >
              {/* Round result grid */}
              <div className="flex justify-center gap-0.5">
                {gameState.roundResults.map((r, i) => (
                  <span key={i} className="text-sm">
                    {r === true ? "🟢" : r === false ? "🔴" : "⚪"}
                  </span>
                ))}
              </div>
            </GameResultCard>

            <GameButton onClick={handleShare} variant="accent">
              {copied ? "✓ Copied!" : "📋 Share Result"}
            </GameButton>

            <GameButton
              onClick={() => setShowExplanations((p) => !p)}
              variant="outline"
            >
              {showExplanations ? "Hide Explanations" : "Review All Rounds"}
            </GameButton>

            {/* Explanations */}
            <AnimatePresence>
              {showExplanations && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2.5 overflow-hidden"
                >
                  {puzzle.rounds.map((round, i) => (
                    <div
                      key={round.category}
                      className="rounded-xl border p-4"
                      style={
                        gameState.roundResults[i]
                          ? { background: "rgba(62,86,65,0.07)", borderColor: "rgba(62,86,65,0.20)" }
                          : { background: "rgba(162,73,54,0.07)", borderColor: "rgba(162,73,54,0.20)" }
                      }
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{gameState.roundResults[i] ? "✅" : "❌"}</span>
                        <h4 className="text-sm font-bold" style={{ color: "#2D2A26" }}>
                          Round {i + 1}: {round.category}
                        </h4>
                      </div>
                      <p className="mt-1 text-xs" style={{ color: "#6B6560" }}>
                        {round.words.join(" · ")}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: "#6B6560" }}>
                        {round.explanation}
                      </p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Play Again — always last */}
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
