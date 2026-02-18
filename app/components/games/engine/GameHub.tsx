"use client";

import * as React from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { getStreakData } from "@/lib/games/streaks";
import { getDailyProgress, type GameStatus } from "@/lib/games/progress";
import { isTelegram, tgBackButton } from "@/lib/telegram";
import { haptic } from "@/lib/games/haptics";
import GameTabBar from "./GameTabBar";
import { cn } from "@/lib/utils";

/* ——— Game list — clean, no accent colours or taglines ——— */
const GAMES = [
  {
    slug: "connections",
    name: "Lingua Connections",
    description: "Group 16 words into 4 hidden categories",
    ready: true,
  },
  {
    slug: "word-ladder",
    name: "Word Ladder",
    description: "Change one letter at a time",
    ready: true,
  },
  {
    slug: "daily-decode",
    name: "Daily Decode",
    description: "Crack the cipher, reveal the quote",
    ready: true,
  },
  {
    slug: "odd-one-out",
    name: "Odd One Out",
    description: "Spot the word that doesn't belong",
    ready: true,
  },
  {
    slug: "missing-piece",
    name: "Missing Piece",
    description: "Fill in the missing word",
    ready: true,
  },
  {
    slug: "synonym-spiral",
    name: "Synonym Spiral",
    description: "Climb from basic to literary synonyms",
    ready: true,
  },
] as const;

/* ——— Game Card ——— */
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

  return (
    <Link
      href={`/games/${game.slug}`}
      data-card-index={index}
      className="game-card block rounded-2xl transition-transform active:scale-[0.98] touch-manipulation"
      style={{
        background: "#FFFFFF",
        border: "1px solid rgba(45, 42, 38, 0.06)",
        boxShadow: "0 1px 3px rgba(45, 42, 38, 0.04)",
      }}
      onClick={() => haptic("tap")}
    >
      <div className="flex items-center justify-between px-5 py-4">
        <div className="min-w-0">
          <h3
            className="text-[15px] font-semibold"
            style={{ color: "#2D2A26" }}
          >
            {game.name}
          </h3>
          <p
            className="text-[13px] mt-0.5"
            style={{ color: "#9C9590" }}
          >
            {game.description}
          </p>
        </div>

        {/* Status indicator */}
        <div className="flex-shrink-0 ml-4">
          {isDone ? (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(62, 86, 65, 0.1)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="#3E5641" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              style={{ color: "#9C9590" }}
            >
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ——— Main Hub ——— */
export default function GameHub() {
  const [streak, setStreak] = React.useState({ current: 0, longest: 0 });
  const [gameStatuses, setGameStatuses] = React.useState<Record<string, GameStatus>>({});
  const [activeTab, setActiveTab] = React.useState("play");
  const inTg = React.useMemo(() => typeof window !== "undefined" && isTelegram(), []);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const data = getStreakData();
    setStreak({ current: data.current, longest: data.longest });

    const progress = getDailyProgress();
    setGameStatuses(progress.games);

    if (isTelegram()) {
      tgBackButton.hide();
    }
  }, []);

  /* GSAP entrance */
  useGSAP(
    () => {
      gsap.from(".hub-header", {
        y: -20,
        opacity: 0,
        duration: 0.4,
        ease: "power3.out",
      });
      gsap.from(".game-card", {
        y: 40,
        opacity: 0,
        stagger: 0.06,
        duration: 0.5,
        ease: "power3.out",
        delay: 0.1,
      });
    },
    { scope: containerRef },
  );

  const completedCount = Object.values(gameStatuses).filter(
    (s) => s === "won" || s === "played",
  ).length;

  const getStatus = (slug: string): GameStatus => gameStatuses[slug] ?? "unplayed";

  return (
    <div ref={containerRef} className="min-h-[100dvh]" style={{ background: "#FDF8F5" }}>
      <div
        className={cn(
          "relative z-10 pt-5",
          inTg && "tg-content-safe-top",
        )}
        style={{
          paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* Header */}
        <div className="hub-header px-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="text-xl font-bold"
                style={{ color: "#2D2A26" }}
              >
                Games
              </h1>
              <p
                className="text-xs mt-0.5"
                style={{ color: "#9C9590" }}
              >
                {completedCount}/{GAMES.length} completed today
              </p>
            </div>

            {/* Streak */}
            {streak.current > 0 && (
              <div
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                style={{
                  background: "rgba(211, 97, 53, 0.08)",
                  border: "1px solid rgba(211, 97, 53, 0.12)",
                }}
              >
                <span className="text-sm">🔥</span>
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{ color: "#D36135" }}
                >
                  {streak.current}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Game cards */}
        <div className="px-4 flex flex-col gap-2">
          {GAMES.map((game, i) => (
            <GameCard
              key={game.slug}
              game={game}
              status={getStatus(game.slug)}
              index={i}
            />
          ))}
        </div>

        {/* Footer */}
        <p
          className="mt-6 text-center text-[11px]"
          style={{ color: "#9C9590" }}
        >
          New puzzles daily
        </p>
      </div>

      {/* Tab bar */}
      <GameTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
