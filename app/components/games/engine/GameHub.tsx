"use client";

import * as React from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { getStreakData } from "@/lib/games/streaks";
import { getDailyProgress, type GameStatus } from "@/lib/games/progress";
import { isTelegram, tgBackButton } from "@/lib/telegram";
import { haptic } from "@/lib/games/haptics";
import { fireConfetti } from "@/lib/games/juice";
import { cn } from "@/lib/utils";
import { GAME_ICON_MAP } from "./GameIcons";

/* ——— Game list ——— */
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
  {
    slug: "neon-intercept",
    name: "Neon Intercept",
    description: "Tap the right lane before words land",
    ready: true,
  },
] as const;

/* ——— Game Card ——— */
function GameCard({
  game,
  status,
  index,
  statusesLoaded,
}: {
  game: (typeof GAMES)[number];
  status: GameStatus;
  index: number;
  statusesLoaded: boolean;
}) {
  const isDone = status === "won" || status === "played";
  const IconComponent = GAME_ICON_MAP[game.slug];

  return (
    <Link
      href={`/games/${game.slug}`}
      data-card-index={index}
      className="game-card block rounded-2xl transition-all active:scale-[0.97] hover:shadow-md cursor-pointer touch-manipulation"
      style={{
        background: "#FFFFFF",
        border: "1px solid rgba(45, 42, 38, 0.08)",
        boxShadow: "0 1px 3px rgba(45, 42, 38, 0.06), 0 1px 2px rgba(45, 42, 38, 0.04)",
      }}
      onClick={() => haptic("tap")}
    >
      <div className="flex items-center gap-3.5 px-4 py-3.5">
        {/* Game icon — premium SVG */}
        <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden"
          style={{ background: "#FDF8F5" }}
        >
          {IconComponent ? <IconComponent size={36} /> : <span className="text-lg">🎮</span>}
        </div>

        {/* Game info */}
        <div className="min-w-0 flex-1">
          <h3
            className="text-[14px] font-semibold leading-tight"
            style={{ color: "#2D2A26", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {game.name}
          </h3>
          <p
            className="text-[12px] mt-0.5 leading-snug"
            style={{ color: "#9C9590", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {game.description}
          </p>
        </div>

        {/* Status indicator */}
        <div
          className="flex-shrink-0 transition-opacity duration-300"
          style={{ opacity: statusesLoaded ? 1 : 0 }}
        >
          {isDone ? (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "rgba(62, 86, 65, 0.12)" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="#3E5641" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              style={{ color: "#C5BFBA" }}
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
  const [statusesLoaded, setStatusesLoaded] = React.useState(false);
  const inTg = React.useMemo(() => typeof window !== "undefined" && isTelegram(), []);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const data = getStreakData();
    setStreak({ current: data.current, longest: data.longest });

    const progress = getDailyProgress();
    setGameStatuses(progress.games);
    setStatusesLoaded(true);

    if (isTelegram()) {
      tgBackButton.hide();
    }
  }, []);

  /* GSAP entrance — use `to` from safe defaults so cards are always visible */
  useGSAP(
    () => {
      // Set initial state via GSAP (not CSS) so cards are visible without JS
      gsap.set(".game-card", { y: 20, opacity: 0.3 });
      gsap.set(".hub-header", { y: -10, opacity: 0.3 });

      gsap.to(".hub-header", {
        y: 0,
        opacity: 1,
        duration: 0.35,
        ease: "power3.out",
      });
      gsap.to(".game-card", {
        y: 0,
        opacity: 1,
        stagger: 0.05,
        duration: 0.4,
        ease: "power3.out",
        delay: 0.08,
      });
    },
    { scope: containerRef },
  );

  const completedCount = Object.values(gameStatuses).filter(
    (s) => s === "won" || s === "played",
  ).length;

  const allComplete = completedCount === GAMES.length;

  // 🎉 Celebrate when all games completed — fire once per day
  React.useEffect(() => {
    if (!allComplete || !statusesLoaded) return;
    const today = new Date().toISOString().split("T")[0];
    const key = `hub_celebrated_${today}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    // Small delay so the UI has rendered
    const timer = setTimeout(() => {
      void fireConfetti({
        particleCount: 100,
        spread: 120,
        startVelocity: 35,
        gravity: 0.7,
        ticks: 120,
        origin: { y: 0.3 },
        colors: ["#D36135", "#3E5641", "#D4A843", "#FFFFFF", "#5A8AB5"],
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [allComplete, statusesLoaded]);

  const getStatus = (slug: string): GameStatus => gameStatuses[slug] ?? "unplayed";

  return (
    <div ref={containerRef} className="min-h-[100dvh]" style={{ background: "#FDF8F5" }}>
      <div
        className={cn(
          "relative z-10 pt-5 max-w-md mx-auto",
          inTg && "tg-content-safe-top",
        )}
        style={{
          paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* Header */}
        <div className="hub-header px-5 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="text-[26px] tracking-tight"
                style={{ color: "#2D2A26", fontFamily: "'Mansalva', cursive" }}
              >
                Games
              </h1>
              {/* Progress bar + text */}
              <div className="flex items-center gap-2 mt-1.5">
                <div
                  className="h-1.5 rounded-full flex-1 max-w-[120px] overflow-hidden"
                  style={{ background: "rgba(45, 42, 38, 0.06)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${(completedCount / GAMES.length) * 100}%`,
                      background: allComplete ? "#3E5641" : "#D36135",
                      minWidth: completedCount > 0 ? "8px" : "0px",
                    }}
                  />
                </div>
                <p
                  className="text-[11px] font-medium tabular-nums"
                  style={{ color: allComplete ? "#3E5641" : "#9C9590" }}
                >
                  {allComplete ? "All done! 🏆" : `${completedCount} of ${GAMES.length}`}
                </p>
              </div>
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
              statusesLoaded={statusesLoaded}
            />
          ))}
        </div>

        {/* Footer */}
        <p
          className="mt-5 text-center text-[11px]"
          style={{ color: "#C5BFBA" }}
        >
          New puzzles every day · tutorlingua.co
        </p>
      </div>

    </div>
  );
}
