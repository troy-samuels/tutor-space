"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { getStreakData, getStreakTier } from "@/lib/games/streaks";
import { getDailyProgress, type GameStatus } from "@/lib/games/progress";
import { cn } from "@/lib/utils";

/* ——— Game registry ——— */
const GAMES = [
  {
    slug: "connections",
    name: "Lingua Connections",
    description: "Group 16 words into 4 hidden categories",
    emoji: "🔗",
    colour: "from-amber-500/20 to-orange-500/20",
    borderHover: "hover:border-amber-500/40",
  },
  {
    slug: "word-ladder",
    name: "Word Ladder",
    description: "Change one letter at a time to reach the target",
    emoji: "🪜",
    colour: "from-emerald-500/20 to-teal-500/20",
    borderHover: "hover:border-emerald-500/40",
  },
  {
    slug: "daily-decode",
    name: "Daily Decode",
    description: "Crack the cipher to reveal a famous quote",
    emoji: "🔐",
    colour: "from-violet-500/20 to-purple-500/20",
    borderHover: "hover:border-violet-500/40",
  },
  {
    slug: "odd-one-out",
    name: "Odd One Out",
    description: "Find the word that doesn't belong",
    emoji: "🎯",
    colour: "from-blue-500/20 to-indigo-500/20",
    borderHover: "hover:border-blue-500/40",
  },
  {
    slug: "missing-piece",
    name: "Missing Piece",
    description: "Fill the blank — the distractors are nasty",
    emoji: "🧩",
    colour: "from-rose-500/20 to-pink-500/20",
    borderHover: "hover:border-rose-500/40",
  },
  {
    slug: "synonym-spiral",
    name: "Synonym Spiral",
    description: "How sophisticated can your vocabulary get?",
    emoji: "🌀",
    colour: "from-cyan-500/20 to-sky-500/20",
    borderHover: "hover:border-cyan-500/40",
  },
] as const;

/* ——— SVG Progress Ring ——— */
function ProgressRing({ status }: { status: GameStatus }) {
  const r = 10;
  const c = 2 * Math.PI * r;

  return (
    <svg width="28" height="28" viewBox="0 0 28 28" className="flex-shrink-0">
      {/* Track */}
      <circle
        cx="14"
        cy="14"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="text-white/[0.08]"
      />
      {/* Fill */}
      {status !== "unplayed" && (
        <motion.circle
          cx="14"
          cy="14"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={
            status === "won" ? "text-amber-400" : "text-primary"
          }
          style={{
            transformOrigin: "center",
            transform: "rotate(-90deg)",
          }}
        />
      )}
      {/* Inner dot for won */}
      {status === "won" && (
        <motion.circle
          cx="14"
          cy="14"
          r="3"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 400 }}
          className="fill-amber-400"
        />
      )}
    </svg>
  );
}

/* ——— Breathing Pulse for unplayed games ——— */
function PulseWrapper({
  isUnplayed,
  children,
}: {
  isUnplayed: boolean;
  children: React.ReactNode;
}) {
  if (!isUnplayed) return <>{children}</>;
  return (
    <motion.div
      animate={{ scale: [1, 1.015, 1] }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
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
      className="flex items-center gap-1.5"
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
      <span className="text-lg">🔥</span>
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

  React.useEffect(() => {
    const data = getStreakData();
    setStreak({ current: data.current, longest: data.longest });
    setStreakTier(getStreakTier(data.current));

    const progress = getDailyProgress();
    setGameStatuses(progress.games);

    // Check if streak is at risk (after 9 PM)
    const hour = new Date().getHours();
    setIsLateNight(hour >= 21 && data.gamesPlayedToday.length === 0);
  }, []);

  const getStatus = (slug: string): GameStatus => gameStatuses[slug] ?? "unplayed";
  const playedCount = Object.values(gameStatuses).filter(
    (s) => s === "played" || s === "won"
  ).length;

  return (
    <div className="dark min-h-[100dvh] bg-background px-4 py-6">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Logo variant="icon" className="h-7 w-7" />
            </Link>
            <StreakFlame
              count={streak.current}
              atRisk={isLateNight}
            />
          </div>

          <div className="mt-4">
            <h1 className="font-heading text-2xl text-foreground">
              Language Games
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {playedCount === 0
                ? "Daily puzzles to level up your vocabulary"
                : `${playedCount}/${GAMES.length} played today`}
            </p>
          </div>

          {/* Streak badge */}
          {streak.current > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3"
            >
              <Badge
                variant="outline"
                className="gap-1.5 text-xs font-medium"
              >
                {streakTier.emoji} {streakTier.name} · {streak.current} day
                {streak.current !== 1 ? "s" : ""}
              </Badge>
            </motion.div>
          )}
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-2 gap-3">
          {GAMES.map((game, i) => {
            const status = getStatus(game.slug);

            return (
              <PulseWrapper key={game.slug} isUnplayed={status === "unplayed"}>
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 25 }}
                >
                  <Link
                    href={`/games/${game.slug}`}
                    className={cn(
                      "group relative flex flex-col rounded-2xl border border-border/50 bg-card p-4 transition-all",
                      "min-h-[140px] touch-manipulation",
                      "hover:shadow-lg active:scale-[0.98]",
                      game.borderHover,
                    )}
                  >
                    {/* Gradient overlay */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100",
                        game.colour,
                      )}
                    />

                    {/* Content */}
                    <div className="relative z-10 flex flex-1 flex-col">
                      <div className="flex items-start justify-between">
                        <span className="text-2xl">{game.emoji}</span>
                        <ProgressRing status={status} />
                      </div>

                      <div className="mt-auto pt-3">
                        <h2 className="font-heading text-sm font-bold text-foreground leading-tight">
                          {game.name}
                        </h2>
                        <p className="mt-1 text-[11px] leading-snug text-muted-foreground line-clamp-2">
                          {game.description}
                        </p>
                      </div>
                    </div>

                    {/* Played indicator */}
                    {status !== "unplayed" && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute top-3 right-3"
                      >
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          {status === "won" ? "✓" : "•"}
                        </span>
                      </motion.div>
                    )}
                  </Link>
                </motion.div>
              </PulseWrapper>
            );
          })}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          New puzzles every day · Come back tomorrow
        </p>
      </div>
    </div>
  );
}
