"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { getStreakData, getStreakTier } from "@/lib/games/streaks";
import { getDailyProgress, type GameStatus } from "@/lib/games/progress";
import { isTelegram, tgBackButton } from "@/lib/telegram";
import { cn } from "@/lib/utils";

/* ——— Game registry ——— */
const GAMES = [
  {
    slug: "connections",
    name: "Lingua Connections",
    description: "Group 16 words into 4 hidden categories",
    emoji: "🔗",
    accent: "bg-amber-500",
  },
  {
    slug: "word-ladder",
    name: "Word Ladder",
    description: "Change one letter at a time to reach the target",
    emoji: "🪜",
    accent: "bg-emerald-500",
  },
  {
    slug: "daily-decode",
    name: "Daily Decode",
    description: "Crack the cipher to reveal a famous quote",
    emoji: "🔐",
    accent: "bg-violet-500",
  },
  {
    slug: "odd-one-out",
    name: "Odd One Out",
    description: "Find the word that doesn't belong",
    emoji: "🎯",
    accent: "bg-blue-500",
  },
  {
    slug: "missing-piece",
    name: "Missing Piece",
    description: "Fill the blank — the distractors are nasty",
    emoji: "🧩",
    accent: "bg-rose-500",
  },
  {
    slug: "synonym-spiral",
    name: "Synonym Spiral",
    description: "How sophisticated can your vocabulary get?",
    emoji: "🌀",
    accent: "bg-cyan-500",
  },
] as const;

/* ——— Status indicator ——— */
function StatusDot({ status }: { status: GameStatus }) {
  if (status === "unplayed") return null;
  return (
    <div
      className={cn(
        "h-2 w-2 rounded-full flex-shrink-0",
        status === "won" ? "bg-amber-400" : "bg-primary",
      )}
    />
  );
}

/* ——— Streak Flame ——— */
function StreakFlame({
  count,
  atRisk,
}: {
  count: number;
  atRisk: boolean;
}) {
  if (count === 0) return null;

  return (
    <motion.div
      className="flex items-center gap-1"
      animate={
        atRisk
          ? { opacity: [1, 0.5, 1], scale: [1, 0.95, 1] }
          : undefined
      }
      transition={
        atRisk
          ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
          : undefined
      }
    >
      <span className="text-base">🔥</span>
      <span className="text-sm font-bold tabular-nums text-foreground">
        {count}
      </span>
    </motion.div>
  );
}

/* ——— Main Hub ——— */
export default function GameHub() {
  const [streak, setStreak] = React.useState({ current: 0, longest: 0 });
  const [streakTier, setStreakTier] = React.useState({ name: "New", emoji: "🌱" });
  const [gameStatuses, setGameStatuses] = React.useState<Record<string, GameStatus>>({});
  const [isLateNight, setIsLateNight] = React.useState(false);
  const inTg = React.useMemo(() => typeof window !== "undefined" && isTelegram(), []);

  React.useEffect(() => {
    const data = getStreakData();
    setStreak({ current: data.current, longest: data.longest });
    setStreakTier(getStreakTier(data.current));

    const progress = getDailyProgress();
    setGameStatuses(progress.games);

    const hour = new Date().getHours();
    setIsLateNight(hour >= 21 && data.gamesPlayedToday.length === 0);

    // Hide Telegram back button on hub
    if (isTelegram()) {
      tgBackButton.hide();
    }
  }, []);

  const getStatus = (slug: string): GameStatus => gameStatuses[slug] ?? "unplayed";
  const playedCount = Object.values(gameStatuses).filter(
    (s) => s === "played" || s === "won",
  ).length;

  return (
    <div className="dark min-h-[100dvh] bg-background">
      {/* Compact header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/95 backdrop-blur-md px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-foreground">
              🎮 Games
            </h1>
            {playedCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {playedCount}/{GAMES.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {streak.current > 0 && (
              <Badge
                variant="outline"
                className="gap-1 text-[10px] font-medium px-2 py-0.5"
              >
                {streakTier.emoji} {streakTier.name}
              </Badge>
            )}
            <StreakFlame count={streak.current} atRisk={isLateNight} />
          </div>
        </div>
      </header>

      {/* Game list */}
      <div className="px-4 py-3 pb-safe">
        {/* Subtitle */}
        <p className="text-xs text-muted-foreground mb-3">
          {playedCount === 0
            ? "Daily puzzles to level up your vocabulary"
            : "Tap to play — new puzzles daily"}
        </p>

        {/* Game tiles — single column for Telegram, 2-col grid otherwise */}
        <div className={cn(
          "grid gap-2",
          inTg ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2",
        )}>
          {GAMES.map((game, i) => {
            const status = getStatus(game.slug);

            return (
              <motion.div
                key={game.slug}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: i * 0.04,
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                }}
              >
                <Link
                  href={`/games/${game.slug}`}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3 transition-all",
                    "touch-manipulation active:scale-[0.98] active:bg-card/80",
                    "min-h-[56px]",
                  )}
                >
                  {/* Emoji with accent pip */}
                  <div className="relative flex-shrink-0">
                    <span className="text-2xl">{game.emoji}</span>
                    <div
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card",
                        status === "won"
                          ? "bg-amber-400"
                          : status === "played"
                            ? "bg-primary"
                            : game.accent + " opacity-40",
                      )}
                    />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-foreground leading-tight">
                      {game.name}
                    </h2>
                    <p className="text-[11px] leading-snug text-muted-foreground truncate">
                      {game.description}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex-shrink-0 flex items-center gap-1.5">
                    <StatusDot status={status} />
                    <svg
                      className="h-4 w-4 text-muted-foreground/40"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Minimal footer */}
        {!inTg && (
          <p className="mt-6 text-center text-[10px] text-muted-foreground/50">
            TutorLingua · New puzzles daily
          </p>
        )}
      </div>
    </div>
  );
}
