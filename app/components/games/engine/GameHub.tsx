"use client";

import * as React from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { getStreakData, getStreakTier } from "@/lib/games/streaks";
import { getDailyProgress, type GameStatus } from "@/lib/games/progress";
import { isTelegram, tgBackButton } from "@/lib/telegram";
import { haptic } from "@/lib/games/haptics";
import GameTabBar from "./GameTabBar";
import { cn } from "@/lib/utils";
import {
  GAME_ICON_MAP,
  StatBrainIcon,
  StatWordsIcon,
  StatStreakIcon,
} from "./GameIcons";

/* ——— Game metadata with accent colours ——— */
const GAMES = [
  {
    slug: "connections",
    name: "Lingua Connections",
    description: "Group 16 words into 4 hidden categories",
    accent: "#C4A835",
    accentGlow: "rgba(196, 168, 53, 0.08)",
    tagline: "Find the link",
  },
  {
    slug: "strands",
    name: "Lingua Strands",
    description: "Find themed words hidden in a letter grid",
    accent: "#4A7EC5",
    accentGlow: "rgba(74, 126, 197, 0.08)",
    tagline: "Trace the path",
  },
  {
    slug: "spell-cast",
    name: "Spell Cast",
    description: "Form words from 7 letters in a honeycomb",
    accent: "#4A8C5C",
    accentGlow: "rgba(74, 140, 92, 0.08)",
    tagline: "Unlock the hive",
  },
  {
    slug: "speed-clash",
    name: "Speed Clash",
    description: "Pick natural responses in 60 seconds",
    accent: "#DC3545",
    accentGlow: "rgba(220, 53, 69, 0.08)",
    tagline: "Beat the clock",
  },
  {
    slug: "daily-decode",
    name: "Daily Decode",
    description: "Fill blanks in an unfolding mystery story",
    accent: "#8B5CB5",
    accentGlow: "rgba(139, 92, 181, 0.08)",
    tagline: "Solve the mystery",
  },
  {
    slug: "word-ladder",
    name: "Word Ladder",
    description: "Change one letter at a time",
    accent: "#0D9668",
    accentGlow: "rgba(13, 150, 104, 0.08)",
    tagline: "Climb the chain",
  },
  {
    slug: "odd-one-out",
    name: "Odd One Out",
    description: "Spot the word that doesn't belong",
    accent: "#D48C09",
    accentGlow: "rgba(212, 140, 9, 0.08)",
    tagline: "Trust your instincts",
  },
  {
    slug: "missing-piece",
    name: "Missing Piece",
    description: "Fill in the missing word",
    accent: "#C93D82",
    accentGlow: "rgba(201, 61, 130, 0.08)",
    tagline: "Complete the sentence",
  },
  {
    slug: "synonym-spiral",
    name: "Synonym Spiral",
    description: "Climb the tower of synonyms",
    accent: "#7C4FD0",
    accentGlow: "rgba(124, 79, 208, 0.08)",
    tagline: "Expand your vocabulary",
  },
] as const;

/* ——— Hero Game Card — Netflix-style immersive cards ——— */
function HeroGameCard({
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
  const cardRef = React.useRef<HTMLAnchorElement>(null);

  return (
    <Link
      ref={cardRef}
      href={`/games/${game.slug}`}
      data-card-index={index}
      className="game-hero-card relative block w-[92%] mx-auto touch-manipulation active:scale-[0.97] transition-transform duration-100"
      style={{ aspectRatio: "16 / 9" }}
      onClick={() => haptic("tap")}
    >
      {/* Card body */}
      <div
        className="relative h-full w-full overflow-hidden"
        style={{
          background: "#FFFFFF",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          borderRadius: "24px",
          boxShadow: `0 2px 12px rgba(0, 0, 0, 0.06)`,
        }}
      >

        {/* Content layout */}
        <div className="relative z-10 flex h-full items-center px-6 gap-5">
          {/* Icon — large, prominent */}
          <div
            className="flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-2xl"
            style={{
              background: `rgba(0, 0, 0, 0.03)`,
              border: `1px solid rgba(0, 0, 0, 0.06)`,
            }}
          >
            {IconComponent ? <IconComponent size={36} /> : null}
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            {/* Tagline */}
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-1"
              style={{ color: game.accent, opacity: 0.8 }}
            >
              {game.tagline}
            </p>
            {/* Game name */}
            <h3
              className="text-xl font-extrabold tracking-tight leading-tight"
              style={{ color: "#1A1A1B" }}
            >
              {game.name}
            </h3>
            {/* Description */}
            <p
              className="text-[13px] mt-1 leading-snug"
              style={{ color: "#5A5A5C" }}
            >
              {game.description}
            </p>
          </div>

          {/* Play / Done badge */}
          <div className="flex-shrink-0">
            {isDone ? (
              <div
                className="flex items-center justify-center w-12 h-12 rounded-full"
                style={{
                  background: "rgba(34, 197, 94, 0.15)",
                  border: "2px solid rgba(34, 197, 94, 0.3)",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M20 6L9 17L4 12"
                    stroke="#22c55e"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            ) : (
              <div
                className="play-button flex items-center justify-center w-12 h-12 rounded-full"
                style={{
                  background: game.accent,
                  boxShadow: `0 2px 8px rgba(0,0,0,0.12)`,
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M5 3L19 12L5 21V3Z"
                    fill="#FFFFFF"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Bottom accent line */}
        <div
          className="absolute bottom-0 left-6 right-6 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${game.accent}25, transparent)`,
          }}
          aria-hidden
        />
      </div>
    </Link>
  );
}

/* ——— Main Hub ——— */
export default function GameHub() {
  const [streak, setStreak] = React.useState({ current: 0, longest: 0 });
  const [streakTier, setStreakTier] = React.useState({ name: "New", emoji: "🌱" });
  const [gameStatuses, setGameStatuses] = React.useState<
    Record<string, GameStatus>
  >({});
  const [activeTab, setActiveTab] = React.useState("play");
  const inTg = React.useMemo(
    () => typeof window !== "undefined" && isTelegram(),
    [],
  );
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const data = getStreakData();
    setStreak({ current: data.current, longest: data.longest });
    setStreakTier(getStreakTier(data.current));

    const progress = getDailyProgress();
    setGameStatuses(progress.games);

    if (isTelegram()) {
      tgBackButton.hide();
    }
  }, []);

  /* ——— GSAP entrance animation ——— */
  useGSAP(
    () => {
      // Header slide down
      gsap.from(".hub-header", {
        y: -30,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
      });

      // Cards stagger slide up — the "Netflix scroll" feel
      gsap.from(".game-hero-card", {
        y: 80,
        opacity: 0,
        stagger: 0.08,
        duration: 0.6,
        ease: "back.out(1.2)",
        delay: 0.15,
      });

      // Stats card fade in last
      gsap.from(".stats-card", {
        y: 40,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        delay: 0.6,
      });

      // Play button pulse — subtle shadow pulse
      gsap.to(".play-button", {
        boxShadow:
          "0 4px 16px rgba(0,0,0,0.15)",
        repeat: -1,
        yoyo: true,
        duration: 1.5,
        ease: "sine.inOut",
        delay: 1,
      });
    },
    { scope: containerRef },
  );

  const getStatus = (slug: string): GameStatus =>
    gameStatuses[slug] ?? "unplayed";

  return (
    <div ref={containerRef} className="min-h-[100dvh] game-canvas">

      <div
        className={cn(
          "relative z-10 pt-5",
          inTg && "tg-content-safe-top",
        )}
        style={{
          paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* ——— Header ——— */}
        <div className="hub-header flex items-center justify-between px-5 mb-6">
          <div>
            <h1
              className="text-2xl font-extrabold tracking-tight"
              style={{ color: "#1A1A1B" }}
            >
              Games
            </h1>
            <p
              className="text-[12px] mt-0.5"
              style={{ color: "#939598" }}
            >
              {Object.values(gameStatuses).filter(
                (s) => s === "won" || s === "played",
              ).length}
              /{GAMES.length} completed today
            </p>
          </div>

          {/* Streak badge — prominent */}
          <div
            className="flex items-center gap-2 rounded-2xl px-4 py-2.5"
            style={{
              background:
                streak.current > 0
                  ? "linear-gradient(135deg, rgba(230,126,34,0.08) 0%, rgba(201,180,88,0.06) 100%)"
                  : "rgba(0,0,0,0.03)",
              border:
                streak.current > 0
                  ? "1px solid rgba(230,126,34,0.15)"
                  : "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <span className="text-lg" role="img" aria-label="streak">
              {streak.current > 0 ? "🔥" : streakTier.emoji}
            </span>
            <div className="flex flex-col">
              <span
                className="text-base font-extrabold tabular-nums leading-none"
                style={{
                  color:
                    streak.current > 0 ? "#E67E22" : "#939598",
                }}
              >
                {streak.current}
              </span>
              <span
                className="text-[9px] font-medium uppercase tracking-wider"
                style={{ color: "#939598" }}
              >
                {streak.current === 1
                  ? "day"
                  : streak.current > 0
                    ? "days"
                    : "streak"}
              </span>
            </div>
          </div>
        </div>

        {/* ——— Today's Puzzles section ——— */}
        <div className="px-5 mb-4">
          <h2
            className="text-[11px] font-bold uppercase tracking-[0.15em]"
            style={{ color: "#939598" }}
          >
            Today&apos;s Puzzles
          </h2>
        </div>

        {/* ——— Hero Cards — the main event ——— */}
        <div className="flex flex-col gap-3">
          {GAMES.map((game, i) => (
            <HeroGameCard
              key={game.slug}
              game={game}
              status={getStatus(game.slug)}
              index={i}
            />
          ))}
        </div>

        {/* ——— Stats Card ——— */}
        <div className="stats-card mt-8 mx-5">
          <h2
            className="text-[11px] font-bold uppercase tracking-[0.15em] mb-3"
            style={{ color: "#939598" }}
          >
            Your Progress
          </h2>
          <div
            className="rounded-2xl p-5 flex items-center justify-around"
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}
          >
            {/* CEFR Level */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(196,168,53,0.08)",
                  border: "1px solid rgba(196,168,53,0.12)",
                }}
              >
                <StatBrainIcon size={22} />
              </div>
              <span
                className="text-lg font-extrabold"
                style={{ color: "#C4A835" }}
              >
                B1
              </span>
              <span
                className="text-[10px] font-medium"
                style={{ color: "#939598" }}
              >
                Level
              </span>
            </div>

            {/* Divider */}
            <div
              className="w-px h-14"
              style={{ background: "rgba(0,0,0,0.06)" }}
            />

            {/* Words mastered */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(74,126,197,0.08)",
                  border: "1px solid rgba(74,126,197,0.12)",
                }}
              >
                <StatWordsIcon size={22} />
              </div>
              <span
                className="text-lg font-extrabold tabular-nums"
                style={{ color: "#4A7EC5" }}
              >
                247
              </span>
              <span
                className="text-[10px] font-medium"
                style={{ color: "#939598" }}
              >
                Words
              </span>
            </div>

            {/* Divider */}
            <div
              className="w-px h-14"
              style={{ background: "rgba(0,0,0,0.06)" }}
            />

            {/* Streak */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(230,126,34,0.08)",
                  border: "1px solid rgba(230,126,34,0.12)",
                }}
              >
                <StatStreakIcon size={22} />
              </div>
              <span
                className="text-lg font-extrabold tabular-nums"
                style={{ color: "#E67E22" }}
              >
                {streak.current}
              </span>
              <span
                className="text-[10px] font-medium"
                style={{ color: "#939598" }}
              >
                Streak
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p
          className="mt-6 text-center text-[10px]"
          style={{ color: "#939598", opacity: 0.5 }}
        >
          TutorLingua · New puzzles daily
        </p>
      </div>

      {/* Bottom tab bar */}
      <GameTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
