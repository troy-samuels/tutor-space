"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getStreakData, getStreakTier } from "@/lib/games/streaks";
import { getDailyProgress, type GameStatus } from "@/lib/games/progress";
import { isTelegram, tgBackButton } from "@/lib/telegram";
import GameTabBar from "./GameTabBar";
import { cn } from "@/lib/utils";
import {
  GAME_ICON_MAP,
  StatBrainIcon,
  StatWordsIcon,
  StatStreakIcon,
} from "./GameIcons";

/* ——— CRITICAL-1: Design Bible's 5 games ——— */
const GAMES = [
  {
    slug: "connections",
    name: "Lingua Connections",
    description: "Group 16 words into 4 hidden categories",
  },
  {
    slug: "strands",
    name: "Lingua Strands",
    description: "Find themed words hidden in a letter grid",
  },
  {
    slug: "spell-cast",
    name: "Spell Cast",
    description: "Form words from 7 letters in a honeycomb",
  },
  {
    slug: "speed-clash",
    name: "Speed Clash",
    description: "Pick natural responses in 60 seconds",
  },
  {
    slug: "daily-decode",
    name: "Daily Decode",
    description: "Fill blanks in an unfolding mystery story",
  },
] as const;

/* ——— HIGH-4 / CRITICAL-1: Full-width vertical card list (not 2-column grid) ——— */
function GameCard({
  game,
  status,
  index,
}: {
  game: (typeof GAMES)[number];
  status: GameStatus;
  index: number;
}) {
  const isDone = status === "won" || status === "played";
  const IconComponent = GAME_ICON_MAP[game.slug];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.05,
        type: "spring",
        stiffness: 400,
        damping: 30,
      }}
    >
      <Link
        href={`/games/${game.slug}`}
        className={cn(
          "relative flex items-center gap-4 rounded-xl px-4 py-4 w-full",
          "transition-all duration-150 touch-manipulation active:scale-[0.98]",
          !isDone && "animate-game-pulse-glow",
        )}
        style={{
          background: "var(--game-bg-surface)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Icon — luxury SVG with gradients */}
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
          {IconComponent ? <IconComponent size={40} /> : null}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className="text-sm font-bold truncate"
            style={{ color: "var(--game-text-primary)" }}
          >
            {game.name}
          </h3>
          <p
            className="text-xs mt-0.5 truncate"
            style={{ color: "var(--game-text-secondary)" }}
          >
            {game.description}
          </p>
        </div>

        {/* Status badge */}
        <div className="flex-shrink-0">
          {isDone ? (
            <div
              className="flex items-center gap-1 rounded-full px-2.5 py-1"
              style={{ background: "rgba(34,197,94,0.12)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M20 6L9 17L4 12" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[11px] font-semibold" style={{ color: "#22c55e" }}>
                Done
              </span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1 rounded-full px-2.5 py-1"
              style={{ background: "rgba(99,102,241,0.12)" }}
            >
              <svg width="10" height="12" viewBox="0 0 10 12" fill="none" aria-hidden>
                <path d="M1 1L9 6L1 11V1Z" fill="var(--game-text-accent)" />
              </svg>
              <span className="text-[11px] font-semibold" style={{ color: "var(--game-text-accent)" }}>
                Play
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

/* ——— Main Hub ——— */
export default function GameHub() {
  const [streak, setStreak] = React.useState({ current: 0, longest: 0 });
  const [, setStreakTier] = React.useState({ name: "New", emoji: "🌱" });
  const [gameStatuses, setGameStatuses] = React.useState<Record<string, GameStatus>>({});
  const [activeTab, setActiveTab] = React.useState("play");
  const inTg = React.useMemo(() => typeof window !== "undefined" && isTelegram(), []);

  React.useEffect(() => {
    const data = getStreakData();
    setStreak({ current: data.current, longest: data.longest });
    setStreakTier(getStreakTier(data.current));

    const progress = getDailyProgress();
    setGameStatuses(progress.games);

    // Hide Telegram back button on hub
    if (isTelegram()) {
      tgBackButton.hide();
    }
  }, []);

  const getStatus = (slug: string): GameStatus => gameStatuses[slug] ?? "unplayed";

  return (
    <div className="dark min-h-[100dvh] game-canvas">
      {/* Radial gradient spotlight — Design Bible */}
      <div
        className="pointer-events-none fixed inset-0 game-glow opacity-50"
        aria-hidden
      />

      <div
        className={cn(
          "relative z-10 px-4 pt-4",
          inTg && "tg-content-safe-top",
        )}
        style={{ paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1
            className="text-lg font-bold tracking-tight"
            style={{ color: "var(--game-text-primary)" }}
          >
            TutorLingua Games
          </h1>
          {streak.current > 0 && (
            <div
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
              style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.15)" }}
            >
              <StatStreakIcon size={16} />
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: "var(--game-streak)" }}
              >
                {streak.current}
              </span>
              <span
                className="text-[10px]"
                style={{ color: "var(--game-text-muted)" }}
              >
                day{streak.current !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* TODAY'S PUZZLES — section header */}
        <h2
          className="text-[11px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: "var(--game-text-muted)" }}
        >
          Today&apos;s Puzzles
        </h2>

        {/* Vertical card list — Design Bible Phase 6G */}
        <div className="flex flex-col gap-3">
          {GAMES.map((game, i) => (
            <GameCard
              key={game.slug}
              game={game}
              status={getStatus(game.slug)}
              index={i}
            />
          ))}
        </div>

        {/* YOUR STATS — section at bottom */}
        <div className="mt-8">
          <h2
            className="text-[11px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--game-text-muted)" }}
          >
            Your Stats
          </h2>
          <div
            className="rounded-xl p-4 flex items-center justify-around"
            style={{
              background: "var(--game-bg-surface)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* CEFR Level */}
            <div className="flex flex-col items-center">
              <StatBrainIcon size={22} />
              <span
                className="text-sm font-bold mt-1.5"
                style={{ color: "var(--game-text-accent)" }}
              >
                B1
              </span>
              <span
                className="text-[10px]"
                style={{ color: "var(--game-text-muted)" }}
              >
                Level
              </span>
            </div>
            {/* Words mastered */}
            <div className="flex flex-col items-center">
              <StatWordsIcon size={22} />
              <span
                className="text-sm font-bold mt-1.5 tabular-nums"
                style={{ color: "var(--game-text-accent)" }}
              >
                247
              </span>
              <span
                className="text-[10px]"
                style={{ color: "var(--game-text-muted)" }}
              >
                Words
              </span>
            </div>
            {/* Streak counter */}
            <div className="flex flex-col items-center">
              <StatStreakIcon size={22} />
              <span
                className="text-sm font-bold mt-1.5 tabular-nums"
                style={{ color: "var(--game-streak)" }}
              >
                {streak.current}
              </span>
              <span
                className="text-[10px]"
                style={{ color: "var(--game-text-muted)" }}
              >
                Streak
              </span>
            </div>
          </div>
        </div>

        {/* Minimal footer */}
        <p
          className="mt-6 text-center text-[10px]"
          style={{ color: "var(--game-text-muted)", opacity: 0.5 }}
        >
          TutorLingua · New puzzles daily
        </p>
      </div>

      {/* Bottom tab bar — Design Bible Phase 6A */}
      <GameTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
