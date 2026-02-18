"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { getStreakData, getStreakTier } from "@/lib/games/streaks";
import { getLanguageLabel, isRtl } from "@/lib/games/language-utils";
import { haptic } from "@/lib/games/haptics";
import { recordDailyProgress } from "@/lib/games/progress";
import {
  isTelegram,
  tgBackButton,
  enableClosingConfirmation,
  disableClosingConfirmation,
} from "@/lib/telegram";
import { cn } from "@/lib/utils";

interface GameShellProps {
  gameName: string;
  gameSlug: string;
  puzzleNumber: number;
  language: string;
  isComplete: boolean;
  isWon: boolean;
  mistakes: number;
  children: React.ReactNode;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function GameShell({
  gameName,
  gameSlug,
  puzzleNumber,
  language,
  isComplete,
  isWon,
  mistakes,
  children,
}: GameShellProps) {
  const router = useRouter();
  const [elapsed, setElapsed] = React.useState(0);
  const [streak, setStreak] = React.useState({ current: 0, longest: 0 });
  const [streakTier, setStreakTier] = React.useState({ name: "New", emoji: "🌱" });
  const startTimeRef = React.useRef(Date.now());
  const inTg = React.useMemo(() => typeof window !== "undefined" && isTelegram(), []);

  // Read streak from localStorage on mount
  React.useEffect(() => {
    const data = getStreakData();
    setStreak({ current: data.current, longest: data.longest });
    setStreakTier(getStreakTier(data.current));
  }, []);

  // Telegram BackButton: show on game pages, navigate to hub
  React.useEffect(() => {
    if (!inTg) return;

    const goBack = () => router.push("/games");
    tgBackButton.show();
    tgBackButton.onClick(goBack);

    return () => {
      tgBackButton.offClick(goBack);
      tgBackButton.hide();
    };
  }, [inTg, router]);

  // Closing confirmation: enable during active game, disable when complete
  React.useEffect(() => {
    if (!inTg) return;

    if (!isComplete) {
      enableClosingConfirmation();
    } else {
      disableClosingConfirmation();
    }

    return () => {
      disableClosingConfirmation();
    };
  }, [inTg, isComplete]);

  // Timer — count up until game complete
  React.useEffect(() => {
    if (isComplete) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 1000);
    return () => clearInterval(interval);
  }, [isComplete]);

  // Record progress and haptic on game end
  React.useEffect(() => {
    if (isComplete) {
      recordDailyProgress(gameSlug, isWon);
      haptic(isWon ? "success" : "gameOver");
    }
  }, [isComplete, isWon, gameSlug]);

  const shellRef = React.useRef<HTMLDivElement>(null);
  const languageLabel = getLanguageLabel(language);
  const rtl = isRtl(language);

  /* ——— GSAP entrance — game content slides up ——— */
  useGSAP(
    () => {
      gsap.from(".game-header", {
        y: -20,
        opacity: 0,
        duration: 0.4,
        ease: "power3.out",
      });
      gsap.from(".game-content", {
        y: 30,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        delay: 0.1,
      });
    },
    { scope: shellRef },
  );

  return (
    <div
      ref={shellRef}
      className={cn("min-h-[100dvh] game-canvas game-mode", inTg && "tg-content-safe-top")}
      dir={rtl ? "rtl" : "ltr"}
    >
      {/* Nav — hidden in Telegram (BackButton replaces it) */}
      {!inTg && (
        <nav
          className="px-4 py-3"
          style={{
            borderBottom: "1px solid rgba(45, 42, 38, 0.06)",
          }}
        >
          <div className="flex items-center justify-between">
            <Link
              href="/games"
              className="flex items-center gap-1.5 touch-manipulation"
            >
              <svg
                className="h-4 w-4"
                style={{ color: "#9C9590" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span
                className="text-sm font-medium"
                style={{ color: "#6B6560" }}
              >
                Games
              </span>
            </Link>
          </div>
        </nav>
      )}

      {/* Game header — clean, minimal */}
      <header className={cn(
        "game-header px-4 pb-2",
        inTg ? "pt-2" : "pt-3",
      )}>
        <div className="flex items-center justify-between">
          <h1
            className="font-semibold truncate text-[15px]"
            style={{ color: "var(--game-text-primary)" }}
          >
            {gameName}
          </h1>
          <div
            className="flex items-center gap-1.5 text-xs flex-shrink-0 tabular-nums"
            style={{ color: "var(--game-text-muted)" }}
          >
            <span>#{puzzleNumber}</span>
            <span>·</span>
            <span>{languageLabel}</span>
            <span>·</span>
            <span>{formatTime(elapsed)}</span>
          </div>
        </div>
      </header>

      {/* Game Content — full width */}
      <main className={cn("game-content px-4 pt-3", inTg ? "pb-20" : "pb-24")}>
        {children}
      </main>
    </div>
  );
}

export { formatTime };
