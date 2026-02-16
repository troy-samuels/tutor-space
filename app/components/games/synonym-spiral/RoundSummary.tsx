"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DepthLevel, SynonymChain } from "@/lib/games/data/synonym-spiral/types";

interface RoundSummaryProps {
  chain: SynonymChain;
  depthReached: DepthLevel | 0;
  wordsEntered: string[];
  roundNumber: number;
  totalRounds: number;
  timeMs: number;
  onNext: () => void;
}

const DEPTH_COLOURS: Record<DepthLevel, string> = {
  1: "text-emerald-400",
  2: "text-cyan-400",
  3: "text-blue-400",
  4: "text-purple-400",
  5: "text-amber-400",
};

const DEPTH_BG: Record<DepthLevel, string> = {
  1: "bg-emerald-500/10 border-emerald-500/30",
  2: "bg-cyan-500/10 border-cyan-500/30",
  3: "bg-blue-500/10 border-blue-500/30",
  4: "bg-purple-500/10 border-purple-500/30",
  5: "bg-amber-500/10 border-amber-500/30",
};

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  return `${totalSeconds}s`;
}

export default function RoundSummary({
  chain,
  depthReached,
  wordsEntered,
  roundNumber,
  totalRounds,
  timeMs,
  onNext,
}: RoundSummaryProps) {
  const depthLabel =
    depthReached > 0 ? chain.levels[depthReached - 1].label : "—";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="space-y-4 rounded-2xl border border-border/50 bg-card p-5"
    >
      {/* Header */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Round {roundNumber}/{totalRounds}
        </p>
        <h3 className="mt-1 font-heading text-lg text-foreground">
          {depthReached >= 4 ? "🌟" : depthReached >= 2 ? "👏" : "💪"}{" "}
          {depthReached >= 5
            ? "Mastery!"
            : depthReached >= 3
              ? "Impressive!"
              : depthReached >= 1
                ? "Nice try!"
                : "Time's up!"}
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Depth reached: <span className={cn("font-bold", depthReached > 0 ? DEPTH_COLOURS[depthReached as DepthLevel] : "text-muted-foreground")}>{depthReached}/5</span>
          {" · "}
          <span className="font-mono text-xs">{formatTime(timeMs)}</span>
        </p>
      </div>

      {/* Chain visualization */}
      <div className="space-y-1">
        {/* Starter */}
        <div className="rounded-lg border border-white/20 bg-white/[0.04] px-3 py-1.5 text-center">
          <span className="text-sm font-bold text-foreground">{chain.starterWord}</span>
          <span className="ml-2 text-[10px] text-muted-foreground">({chain.starterTranslation})</span>
        </div>

        {/* Each level */}
        {chain.levels.map((level) => {
          const playerWord = wordsEntered.find((w) =>
            level.validWords.map((v) => v.toLowerCase()).includes(w.toLowerCase()),
          );
          const isReached = depthReached >= level.depth;

          return (
            <div
              key={level.depth}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-center text-xs transition-all",
                isReached
                  ? DEPTH_BG[level.depth]
                  : "border-white/[0.06] bg-white/[0.02] opacity-40",
              )}
            >
              {playerWord ? (
                <span className={cn("font-semibold", DEPTH_COLOURS[level.depth])}>
                  {playerWord}
                </span>
              ) : (
                <span className="text-muted-foreground/50 italic">
                  {level.validWords[0]}?
                </span>
              )}
              <span className="ml-2 text-[10px] text-muted-foreground">
                {level.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Next button */}
      <Button
        onClick={onNext}
        variant="default"
        size="lg"
        className="w-full rounded-xl"
      >
        {roundNumber < totalRounds ? `Next Word (${roundNumber + 1}/${totalRounds})` : "See Results"}
      </Button>
    </motion.div>
  );
}
