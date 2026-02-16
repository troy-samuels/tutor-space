"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SpiralTower from "./SpiralTower";
import WordInput from "./WordInput";
import DepthMeter from "./DepthMeter";
import RoundSummary from "./RoundSummary";
import { recordGamePlay } from "@/lib/games/streaks";
import { haptic } from "@/lib/games/haptics";
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

export default function SynonymSpiralGame({ puzzle, onGameEnd }: SynonymSpiralGameProps) {
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

  const chain = puzzle.chains[currentRound];

  // Clear feedback after delay
  React.useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 2000);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Round timer
  React.useEffect(() => {
    if (showRoundSummary || isComplete) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - roundStartRef.current;
      const remaining = Math.max(0, ROUND_TIME_MS - elapsed);
      setRoundTimeLeft(remaining);

      if (remaining <= 0) {
        // Time's up — end round
        endRound();
      }
    }, 100);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
            message: matchedDepth === 5 ? "🌟 Maximum depth!" : `✓ Level ${matchedDepth}!`,
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
    const flag = puzzle.language === "fr" ? "🇫🇷" : puzzle.language === "de" ? "🇩🇪" : "🇪🇸";
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
        if (d >= 3) return "🟢";
        if (d >= 2) return "🟡";
        if (d >= 1) return "⚪";
        return "⬜";
      })
      .join("");

    const text = [
      `Synonym Spiral #${puzzle.number} ${flag}`,
      `Depth ${avg}/5 avg · ⏱ ${timeStr}`,
      depthEmojis,
      "🌀",
      "tutorlingua.co/games/synonym-spiral",
    ].join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ title: "Synonym Spiral", text });
        return;
      }
    } catch {
      // fallthrough
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="space-y-4"
      >
        <div className="rounded-2xl border border-border/50 bg-card p-6 text-center">
          <div className="text-4xl">
            {avg >= 4 ? "🌟" : avg >= 3 ? "🎉" : avg >= 2 ? "👏" : "💪"}
          </div>
          <h2 className="mt-2 font-heading text-xl text-foreground">
            {avg >= 4
              ? "Vocabulary Master!"
              : avg >= 3
                ? "Impressive Depth!"
                : avg >= 2
                  ? "Good Progress!"
                  : "Keep Practising!"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Average depth: <span className="font-bold text-foreground">{avg.toFixed(1)}/5</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            ⏱ {mins}:{secs.toString().padStart(2, "0")}
          </p>

          {/* Round-by-round */}
          <div className="mx-auto mt-4 max-w-[280px] space-y-1.5">
            {roundResults.map((result, i) => {
              const depthColour =
                result.depthReached >= 4
                  ? "text-purple-400"
                  : result.depthReached >= 3
                    ? "text-blue-400"
                    : result.depthReached >= 2
                      ? "text-cyan-400"
                      : result.depthReached >= 1
                        ? "text-emerald-400"
                        : "text-muted-foreground";

              return (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-border/30 bg-white/[0.02] px-3 py-1.5"
                >
                  <span className="text-xs text-muted-foreground">
                    {puzzle.chains[i].starterWord}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((d) => (
                        <div
                          key={d}
                          className={cn(
                            "h-2 w-2 rounded-full transition-colors",
                            d <= result.depthReached ? "bg-primary" : "bg-white/[0.1]",
                          )}
                        />
                      ))}
                    </div>
                    <span className={cn("text-xs font-bold", depthColour)}>
                      {result.depthReached}/5
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Button
          onClick={handleShare}
          variant="default"
          size="lg"
          className="w-full rounded-xl"
        >
          {copied ? "✓ Copied!" : "📋 Share Result"}
        </Button>
      </motion.div>
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
        <Badge variant="outline" className="text-xs">
          Round {currentRound + 1}/{TOTAL_ROUNDS}
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            "font-mono text-xs tabular-nums",
            timerIsLow && "animate-pulse border-destructive/50 text-destructive",
          )}
        >
          ⏱ {timerSeconds}s
        </Badge>
      </div>

      {/* Main game area: Tower + Depth Meter side by side */}
      <div className="flex gap-3">
        {/* Tower area */}
        <div className="flex-1">
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
