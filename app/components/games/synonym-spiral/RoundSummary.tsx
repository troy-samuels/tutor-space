"use client";

import { motion } from "framer-motion";
import { SPRING } from "@/lib/games/springs";
import GameButton from "@/components/games/engine/GameButton";
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

// Light-theme depth colours
const DEPTH_COLOURS: Record<DepthLevel, string> = {
  1: "text-emerald-700",
  2: "text-sky-700",
  3: "text-indigo-700",
  4: "text-purple-700",
  5: "text-amber-700",
};

const DEPTH_BG: Record<DepthLevel, string> = {
  1: "bg-emerald-100 border-emerald-300",
  2: "bg-sky-100 border-sky-300",
  3: "bg-indigo-100 border-indigo-300",
  4: "bg-purple-100 border-purple-300",
  5: "bg-amber-100 border-amber-300",
};

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
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
      transition={SPRING.standard}
      className="space-y-4 rounded-2xl p-5"
      style={{
        background: "#FFFFFF",
        border: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <div className="text-center">
        <p className="text-xs tabular-nums" style={{ color: "#6B6560" }}>
          Round {roundNumber}/{totalRounds}
        </p>
        <h3 className="mt-1 text-lg font-bold" style={{ color: "#2D2A26" }}>
          {depthReached >= 4 ? "Excellent" : depthReached >= 2 ? "Good" : "Keep going"}{" "}
          {depthReached >= 5
            ? "Mastery!"
            : depthReached >= 3
              ? "Impressive!"
              : depthReached >= 1
                ? "Nice try!"
                : "Time's up!"}
        </h3>
        <p className="mt-0.5 text-sm" style={{ color: "#6B6560" }}>
          Depth reached:{" "}
          <span
            className={cn(
              "font-bold tabular-nums",
              depthReached > 0 ? DEPTH_COLOURS[depthReached as DepthLevel] : "text-[#9C9590]",
            )}
          >
            {depthReached}/5
          </span>
          {" · "}
          <span className="font-mono text-xs tabular-nums">{formatTime(timeMs)}</span>
        </p>
      </div>

      {/* Chain visualization */}
      <div className="space-y-1">
        {/* Starter */}
        <div
          className="rounded-lg border px-3 py-1.5 text-center"
          style={{
            background: "#FFFFFF",
            borderColor: "rgba(0,0,0,0.10)",
          }}
        >
          <span className="text-sm font-bold" style={{ color: "#2D2A26" }}>
            {chain.starterWord}
          </span>
          <span className="ml-2 text-[10px]" style={{ color: "#9C9590" }}>
            ({chain.starterTranslation})
          </span>
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
                  : "border-black/[0.06] bg-black/[0.02] opacity-40",
              )}
            >
              {playerWord ? (
                <span className={cn("font-semibold", DEPTH_COLOURS[level.depth])}>
                  {playerWord}
                </span>
              ) : (
                <span className="italic" style={{ color: "rgba(156,149,144,0.6)" }}>
                  {level.validWords[0]}?
                </span>
              )}
              <span className="ml-2 text-[10px]" style={{ color: "#9C9590" }}>
                {level.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Next button */}
      <GameButton onClick={onNext} variant="primary">
        {roundNumber < totalRounds ? `Next Word (${roundNumber + 1}/${totalRounds})` : "See Results"}
      </GameButton>
    </motion.div>
  );
}
