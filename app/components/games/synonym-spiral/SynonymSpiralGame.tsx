"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameResultCard from "@/components/games/engine/GameResultCard";
import GameButton from "@/components/games/engine/GameButton";
import SpiralTower from "./SpiralTower";
import WordInput from "./WordInput";
import DepthMeter from "./DepthMeter";
import RoundSummary from "./RoundSummary";
import { recordGamePlay } from "@/lib/games/streaks";
import { haptic } from "@/lib/games/haptics";
import { shareResult } from "@/components/games/engine/share";
import { fireConfetti } from "@/lib/games/juice";
import { getLanguageFlag } from "@/lib/games/language-utils";
import { cn } from "@/lib/utils";
import type {
  SynonymSpiralPuzzle,
  DepthLevel,
  RoundResult,
} from "@/lib/games/data/synonym-spiral/types";

interface SynonymSpiralGameProps {
  puzzle: SynonymSpiralPuzzle;
  onGameEnd?: (state: {
    isComplete: boolean;
    isWon: boolean;
    mistakes: number;
    averageDepth: number;
    roundDepths: number[];
    totalTimeMs: number;
  }) => void;
  onPlayAgain?: () => void;
}

const ROUND_TIME_MS = 60_000; // 60 seconds per round
const TOTAL_ROUNDS = 5;

interface TowerWord {
  word: string;
  depth: DepthLevel;
}

interface Feedback {
  type: "success" | "error" | "skip";
  message: string;
}

export default function SynonymSpiralGame({ puzzle, onGameEnd, onPlayAgain }: SynonymSpiralGameProps) {
  const [currentRound, setCurrentRound] = React.useState(0);
  const [currentDepth, setCurrentDepth] = React.useState<DepthLevel | 0>(0);
  const [towerWords, setTowerWords] = React.useState<TowerWord[]>([]);
  const [wordsThisRound, setWordsThisRound] = React.useState<string[]>([]);
  const [roundResults, setRoundResults] = React.useState<RoundResult[]>([]);
  const [showRoundSummary, setShowRoundSummary] = React.useState(false);
  const [isComplete, setIsComplete] = React.useState(false);
  const [feedback, setFeedback] = React.useState<Feedback | null>(null);
  const [roundTimeLeft, setRoundTimeLeft] = React.useState(ROUND_TIME_MS);
  const [copied, setCopied] = React.useState(false);

  const roundStartRef = React.useRef(Date.now());
  const gameStartRef = React.useRef(Date.now());
  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // Stable ref to endRound so the timer effect doesn't need it as a dep
  const endRoundRef = React.useRef<() => void>(() => { /* populated after endRound is defined */ });
  React.useEffect(() => {
    return () => { if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current); };
  }, []);

  const chain = puzzle.chains[currentRound];

  // Clear feedback after delay
  React.useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 2000);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Round timer — uses endRoundRef to avoid stale closure without extra deps
  React.useEffect(() => {
    if (showRoundSummary || isComplete) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - roundStartRef.current;
      const remaining = Math.max(0, ROUND_TIME_MS - elapsed);
      setRoundTimeLeft(remaining);

      if (remaining <= 0) {
        // Time's up — end round
        endRoundRef.current();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [showRoundSummary, isComplete, currentRound]);

  const endRound = React.useCallback(() => {
    const timeMs = Date.now() - roundStartRef.current;
    const result: RoundResult = {
      chainIndex: currentRound,
      depthReached: currentDepth as DepthLevel | 0,
      wordsEntered: [...wordsThisRound],
      timeMs,
    };
    setRoundResults((prev) => [...prev, result]);
    setShowRoundSummary(true);
  }, [currentRound, currentDepth, wordsThisRound]);

  // Keep endRoundRef current so the timer effect always calls latest version
  React.useEffect(() => { endRoundRef.current = endRound; }, [endRound]);

  const handleWordSubmit = React.useCallback(
    (word: string) => {
      if (!chain || showRoundSummary || isComplete) return;

      const normalizedWord = word.toLowerCase().trim();

      // Check if word was already used
      if (wordsThisRound.includes(normalizedWord)) {
        setFeedback({ type: "error", message: "Already used!" });
        return;
      }

      // Check if word matches current starter
      if (normalizedWord === chain.starterWord.toLowerCase()) {
        setFeedback({ type: "error", message: "That's the starter word!" });
        return;
      }

      // Determine target depth (next level)
      const targetDepth: DepthLevel = currentDepth === 0 ? 1 : (Math.min(currentDepth + 1, 5) as DepthLevel);

      // Check all levels from target upward for the word
      let matchedDepth: DepthLevel | null = null;

      for (let d = targetDepth; d <= 5; d++) {
        const level = chain.levels[d - 1];
        if (level.validWords.some((w) => w.toLowerCase() === normalizedWord)) {
          matchedDepth = d as DepthLevel;
          break;
        }
      }

      // Also check current and lower levels (wrong direction)
      if (!matchedDepth) {
        for (let d = 1; d < targetDepth; d++) {
          const level = chain.levels[d - 1];
          if (level.validWords.some((w) => w.toLowerCase() === normalizedWord)) {
            setFeedback({
              type: "error",
              message: `That's a Level ${d} word — you need Level ${targetDepth} or higher!`,
            });
            return;
          }
        }
      }

      if (matchedDepth) {
        // Success!
        haptic("success");
        const skipped = matchedDepth > targetDepth;
        setTowerWords((prev) => [...prev, { word: normalizedWord, depth: matchedDepth as DepthLevel }]);
        setWordsThisRound((prev) => [...prev, normalizedWord]);
        setCurrentDepth(matchedDepth);

        if (skipped) {
          setFeedback({
            type: "skip",
            message: `🚀 Skipped to Level ${matchedDepth}!`,
          });
        } else {
          setFeedback({
            type: "success",
            message: matchedDepth === 5 ? "Maximum depth!" : `✓ Level ${matchedDepth}!`,
          });
        }

        // If reached max depth, auto-end round after a moment
        if (matchedDepth === 5) {
          setTimeout(() => endRound(), 1000);
        }
      } else {
        // Hint based on target level
        const targetLabel = chain.levels[targetDepth - 1].label;
        const hints: Record<string, string[]> = {
          es: [
            "Intenta un sinónimo más básico",
            "Busca algo más intermedio",
            "Necesitas un sinónimo más avanzado",
            "Piensa en algo más literario",
            "Busca una palabra más poética",
          ],
          fr: [
            "Essayez un synonyme plus basique",
            "Cherchez quelque chose d'intermédiaire",
            "Il faut un synonyme plus avancé",
            "Pensez à quelque chose de plus littéraire",
            "Cherchez un mot plus poétique",
          ],
          de: [
            "Versuche ein einfacheres Synonym",
            "Suche etwas auf Mittelstufe",
            "Du brauchst ein fortgeschrittenes Synonym",
            "Denke an etwas Literarisches",
            "Suche ein poetischeres Wort",
          ],
        };
        const langHints = hints[puzzle.language] || hints.es;
        haptic("error");
        setFeedback({
          type: "error",
          message: langHints[targetDepth - 1] || `Try a ${targetLabel} synonym`,
        });
      }
    },
    [chain, currentDepth, wordsThisRound, showRoundSummary, isComplete, endRound, puzzle.language],
  );

  const handleNextRound = React.useCallback(() => {
    const nextRound = currentRound + 1;

    if (nextRound >= TOTAL_ROUNDS) {
      // Game complete
      setIsComplete(true);
      setShowRoundSummary(false);
      recordGamePlay("synonym-spiral");

      const allResults = [...roundResults];
      const allDepths = allResults.map((r) => Number(r.depthReached));
      const avgDepth = allDepths.reduce((a: number, b: number) => a + b, 0) / allDepths.length;
      const totalTime = Date.now() - gameStartRef.current;

      // Victory confetti
      void fireConfetti({
        particleCount: 70,
        spread: 90,
        startVelocity: 32,
        gravity: 0.75,
        ticks: 90,
        origin: { y: 0.5 },
        colors: ["#D36135", "#3E5641", "#D4A843", "#FFFFFF", "#7c3aed"],
      });

      onGameEnd?.({
        isComplete: true,
        isWon: avgDepth >= 3,
        mistakes: 0,
        averageDepth: avgDepth,
        roundDepths: allDepths,
        totalTimeMs: totalTime,
      });
    } else {
      // Next round
      setCurrentRound(nextRound);
      setCurrentDepth(0);
      setTowerWords([]);
      setWordsThisRound([]);
      setShowRoundSummary(false);
      setFeedback(null);
      setRoundTimeLeft(ROUND_TIME_MS);
      roundStartRef.current = Date.now();
    }
  }, [currentRound, roundResults, onGameEnd]);

  const handleShare = React.useCallback(async () => {
    const flag = getLanguageFlag(puzzle.language);
    const depths = roundResults.map((r) => Number(r.depthReached));
    const avg = depths.length > 0 ? (depths.reduce((a: number, b: number) => a + b, 0) / depths.length).toFixed(1) : "0";
    const totalMs = Date.now() - gameStartRef.current;
    const totalSec = Math.floor(totalMs / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

    const depthEmojis = depths
      .map((d) => {
        if (d >= 5) return "🟣";
        if (d >= 4) return "🔵";
        if (d >= 3) return "●";
        if (d >= 2) return "◐";
        if (d >= 1) return "⚪";
        return "⬜";
      })
      .join("");

    const text = [
      `Synonym Spiral #${puzzle.number} ${flag}`,
      `Depth ${avg}/5 avg · ${timeStr}`,
      depthEmojis,
      "🌀",
      "tutorlingua.co/games/synonym-spiral",
    ].join("\n");

    await shareResult(text, "Synonym Spiral", setCopied, copyTimeoutRef);
  }, [puzzle, roundResults]);

  // Timer display
  const timerSeconds = Math.ceil(roundTimeLeft / 1000);
  const timerIsLow = timerSeconds <= 10;

  // Current target depth for input label
  const targetDepth: DepthLevel = currentDepth === 0 ? 1 : (Math.min(currentDepth + 1, 5) as DepthLevel);
  const targetLabel = chain?.levels[targetDepth - 1]?.label || "";

  if (isComplete) {
    // Final results screen
    const allDepths = roundResults.map((r) => Number(r.depthReached));
    const avg = allDepths.reduce((a: number, b: number) => a + b, 0) / allDepths.length;
    const totalMs = Date.now() - gameStartRef.current;
    const totalSec = Math.floor(totalMs / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;

    return (
      <div className="space-y-3">
        <GameResultCard
          emoji={avg >= 4 ? "🌟" : avg >= 3 ? "✨" : avg >= 2 ? "💪" : "📚"}
          heading={
            avg >= 4 ? "Vocabulary Master!"
              : avg >= 3 ? "Impressive Depth!"
                : avg >= 2 ? "Good Progress!"
                  : "Keep Practising!"
          }
          subtext={`Average depth: ${avg.toFixed(1)}/5`}
          timeSeconds={totalSec}
        >
          {/* Round-by-round breakdown */}
          <div className="space-y-1.5 text-left">
            {roundResults.map((result, i) => {
              const depthColour =
                result.depthReached >= 4 ? "#7c3aed"
                  : result.depthReached >= 3 ? "#4338ca"
                    : result.depthReached >= 2 ? "#0369a1"
                      : result.depthReached >= 1 ? "#047857"
                        : "#9C9590";
              return (
                <div
                  key={`round-result-${i}`}
                  className="flex items-center justify-between rounded-lg px-3 py-1.5"
                  style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  <span className="text-xs" style={{ color: "#6B6560" }}>
                    {puzzle.chains[i].starterWord}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((d) => (
                        <div
                          key={d}
                          className="h-2 w-2 rounded-full"
                          style={{
                            background: d <= result.depthReached ? "#D36135" : "rgba(0,0,0,0.08)",
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold tabular-nums" style={{ color: depthColour }}>
                      {result.depthReached}/5
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </GameResultCard>

        <GameButton onClick={handleShare} variant="accent">
          {copied ? "✓ Copied!" : "📋 Share Result"}
        </GameButton>

        {/* Play Again */}
        {onPlayAgain && (
          <GameButton onClick={onPlayAgain} variant="secondary">
            🔄 Play Again
          </GameButton>
        )}
      </div>
    );
  }

  if (showRoundSummary) {
    const lastResult = roundResults[roundResults.length - 1];
    return (
      <RoundSummary
        chain={chain}
        depthReached={lastResult.depthReached}
        wordsEntered={lastResult.wordsEntered}
        roundNumber={currentRound + 1}
        totalRounds={TOTAL_ROUNDS}
        timeMs={lastResult.timeMs}
        onNext={handleNextRound}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Round indicator + timer */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs tabular-nums rounded-full px-2.5 py-0.5 border"
          style={{ color: "#6B6560", borderColor: "rgba(0,0,0,0.12)", background: "transparent" }}
        >
          Round {currentRound + 1}/{TOTAL_ROUNDS}
        </span>
        <span
          className={cn("font-mono text-xs tabular-nums rounded-full px-2.5 py-0.5 border", timerIsLow && "animate-pulse")}
          style={
            timerIsLow
              ? { borderColor: "rgba(162,73,54,0.5)", color: "#A24936", background: "transparent" }
              : { color: "#6B6560", borderColor: "rgba(0,0,0,0.12)", background: "transparent" }
          }
        >
          {timerSeconds}s
        </span>
      </div>

      {/* Main game area: Tower + Depth Meter side by side */}
      <div className="flex gap-2">
        {/* Tower area */}
        <div className="flex-1 min-w-0">
          <SpiralTower
            starterWord={chain.starterWord}
            starterTranslation={chain.starterTranslation}
            words={towerWords}
          />
        </div>

        {/* Depth meter */}
        <div className="w-28 flex-shrink-0">
          <DepthMeter
            currentDepth={currentDepth}
            language={puzzle.language}
          />
        </div>
      </div>

      {/* Input */}
      {currentDepth < 5 && (
        <WordInput
          targetDepthLabel={targetLabel}
          targetDepth={targetDepth}
          onSubmit={handleWordSubmit}
          disabled={showRoundSummary || isComplete}
          feedback={feedback}
        />
      )}
    </div>
  );
}
