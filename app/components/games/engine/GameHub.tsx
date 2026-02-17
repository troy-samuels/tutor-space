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
    accent: "#FDE047",
    accentGlow: "rgba(253, 224, 71, 0.15)",
    tagline: "Find the link",
  },
  {
    slug: "strands",
    name: "Lingua Strands",
    description: "Find themed words hidden in a letter grid",
    accent: "#60A5FA",
    accentGlow: "rgba(96, 165, 250, 0.15)",
    tagline: "Trace the path",
  },
  {
    slug: "spell-cast",
    name: "Spell Cast",
    description: "Form words from 7 letters in a honeycomb",
    accent: "#4ADE80",
    accentGlow: "rgba(74, 222, 128, 0.15)",
    tagline: "Unlock the hive",
  },
  {
    slug: "speed-clash",
    name: "Speed Clash",
    description: "Pick natural responses in 60 seconds",
    accent: "#F87171",
    accentGlow: "rgba(248, 113, 113, 0.15)",
    tagline: "Beat the clock",
  },
  {
    slug: "daily-decode",
    name: "Daily Decode",
    description: "Fill blanks in an unfolding mystery story",
    accent: "#C084FC",
    accentGlow: "rgba(192, 132, 252, 0.15)",
    tagline: "Solve the mystery",
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
          background: `linear-gradient(145deg, #1A2333 0%, #0F1520 100%)`,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "24px",
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 0 ${game.accentGlow}`,
        }}
      >
        {/* Inner glow — top radial */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${game.accentGlow} 0%, transparent 60%)`,
            borderRadius: "24px",
          }}
          aria-hidden
        />

        {/* Floating accent orb — subtle background energy */}
        <div
          className="pointer-events-none absolute animate-pulse"
          style={{
            width: "120px",
            height: "120px",
            right: "-20px",
            top: "-20px",
            background: `radial-gradient(circle, ${game.accentGlow} 0%, transparent 70%)`,
            borderRadius: "50%",
            opacity: 0.6,
          }}
          aria-hidden
        />

        {/* Content layout */}
        <div className="relative z-10 flex h-full items-center px-6 gap-5">
          {/* Icon — large, prominent */}
          <div
            className="flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-2xl"
            style={{
              background: `rgba(255, 255, 255, 0.05)`,
              border: `1px solid rgba(255, 255, 255, 0.08)`,
              boxShadow: `0 0 20px ${game.accentGlow}`,
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
              style={{ color: "#F1F5F9" }}
            >
              {game.name}
            </h3>
            {/* Description */}
            <p
              className="text-[13px] mt-1 leading-snug"
              style={{ color: "#94A3B8" }}
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
                  boxShadow: `0 0 20px ${game.accentGlow}, 0 4px 12px rgba(0,0,0,0.3)`,
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
                    fill="#080C14"
                    stroke="#080C14"
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
            background: `linear-gradient(90deg, transparent, ${game.accent}40, transparent)`,
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

      // Play button pulse — CSS animation triggered after entrance
      gsap.to(".play-button", {
        boxShadow:
          "0 0 30px rgba(255,215,0,0.4), 0 4px 12px rgba(0,0,0,0.3)",
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
    <div ref={containerRef} className="dark min-h-[100dvh] game-canvas">
      {/* Radial gradient spotlight — deep void with gold warmth */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 20%, rgba(255,215,0,0.04) 0%, transparent 60%)",
        }}
        aria-hidden
      />

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
              style={{ color: "#F1F5F9" }}
            >
              Games
            </h1>
            <p
              className="text-[12px] mt-0.5"
              style={{ color: "#64748B" }}
            >
              {Object.values(gameStatuses).filter(
                (s) => s === "won" || s === "played",
              ).length}
              /5 completed today
            </p>
          </div>

          {/* Streak badge — prominent */}
          <div
            className="flex items-center gap-2 rounded-2xl px-4 py-2.5"
            style={{
              background:
                streak.current > 0
                  ? "linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(251,191,36,0.1) 100%)"
                  : "rgba(255,255,255,0.05)",
              border:
                streak.current > 0
                  ? "1px solid rgba(249,115,22,0.2)"
                  : "1px solid rgba(255,255,255,0.06)",
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
                    streak.current > 0 ? "#F97316" : "#64748B",
                }}
              >
                {streak.current}
              </span>
              <span
                className="text-[9px] font-medium uppercase tracking-wider"
                style={{ color: "#64748B" }}
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
            style={{ color: "#475569" }}
          >
            Today&apos;s Puzzles
          </h2>
        </div>

        {/* ——— Hero Cards — the main event ——— */}
        <div className="flex flex-col gap-5">
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
            style={{ color: "#475569" }}
          >
            Your Progress
          </h2>
          <div
            className="rounded-2xl p-5 flex items-center justify-around"
            style={{
              background: "linear-gradient(145deg, #1A2333 0%, #0F1520 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            {/* CEFR Level */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(252,211,77,0.1)",
                  border: "1px solid rgba(252,211,77,0.15)",
                }}
              >
                <StatBrainIcon size={22} />
              </div>
              <span
                className="text-lg font-extrabold"
                style={{ color: "#FCD34D" }}
              >
                B1
              </span>
              <span
                className="text-[10px] font-medium"
                style={{ color: "#64748B" }}
              >
                Level
              </span>
            </div>

            {/* Divider */}
            <div
              className="w-px h-14"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />

            {/* Words mastered */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(96,165,250,0.1)",
                  border: "1px solid rgba(96,165,250,0.15)",
                }}
              >
                <StatWordsIcon size={22} />
              </div>
              <span
                className="text-lg font-extrabold tabular-nums"
                style={{ color: "#60A5FA" }}
              >
                247
              </span>
              <span
                className="text-[10px] font-medium"
                style={{ color: "#64748B" }}
              >
                Words
              </span>
            </div>

            {/* Divider */}
            <div
              className="w-px h-14"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />

            {/* Streak */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(249,115,22,0.1)",
                  border: "1px solid rgba(249,115,22,0.15)",
                }}
              >
                <StatStreakIcon size={22} />
              </div>
              <span
                className="text-lg font-extrabold tabular-nums"
                style={{ color: "#F97316" }}
              >
                {streak.current}
              </span>
              <span
                className="text-[10px] font-medium"
                style={{ color: "#64748B" }}
              >
                Streak
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p
          className="mt-6 text-center text-[10px]"
          style={{ color: "#475569", opacity: 0.5 }}
        >
          TutorLingua · New puzzles daily
        </p>
      </div>

      {/* Bottom tab bar */}
      <GameTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
