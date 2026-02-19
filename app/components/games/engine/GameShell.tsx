"use client";

import * as React from "react";
import Link from "next/link";
import { Fraunces, Manrope } from "next/font/google";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
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

const neonDisplay = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--n-shell-display",
});

const neonUi = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--n-shell-ui",
});

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
  const isV3Theme = gameSlug === "neon-intercept";
  const isV3Mansalva = gameSlug === "byte-choice" || gameSlug === "pixel-pairs" || gameSlug === "relay-sprint";
  const contentWidthClass = (isV3Theme || isV3Mansalva) ? "max-w-3xl" : "max-w-lg";
  const [elapsed, setElapsed] = React.useState(0);
  const startTimeRef = React.useRef(Date.now());
  const inTg = React.useMemo(() => typeof window !== "undefined" && isTelegram(), []);

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
      className={cn(
        "min-h-[100dvh] game-canvas game-mode",
        inTg && "tg-content-safe-top",
        isV3Theme && neonDisplay.variable,
        isV3Theme && neonUi.variable,
      )}
      style={(isV3Theme || isV3Mansalva)
        ? {
            background: "radial-gradient(120% 80% at 50% -10%, rgba(77, 120, 151, 0.14), rgba(247, 243, 238, 0) 55%), #f7f3ee",
          }
        : undefined}
      dir={rtl ? "rtl" : "ltr"}
    >
      {/* Nav — hidden in Telegram (BackButton replaces it) */}
      {!inTg && (
        <nav
          className="px-4 py-2.5"
          style={{ borderBottom: "1px solid rgba(45, 42, 38, 0.06)" }}
        >
          <div className={cn("flex items-center justify-between mx-auto", contentWidthClass)}>
            <Link
              href="/games"
              className="flex items-center gap-1 touch-manipulation min-h-[44px] -ml-2 px-2 rounded-lg active:bg-black/[0.04] transition-colors"
            >
              <svg
                className="h-4 w-4"
                style={{ color: "#9C9590" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span
                className="text-[13px] font-medium"
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
        "game-header px-4 pb-2 mx-auto",
        contentWidthClass,
        inTg ? "pt-2" : "pt-3",
      )}>
        <div className="flex items-baseline justify-between">
          <h1
            className={cn("truncate", (isV3Theme || isV3Mansalva) ? "text-2xl leading-tight" : "text-lg")}
            style={isV3Theme
              ? {
                  color: "var(--game-text-primary)",
                  fontFamily: "var(--n-shell-display), 'Fraunces', serif",
                  fontWeight: 650,
                  letterSpacing: "0.01em",
                }
              : { color: "var(--game-text-primary)", fontFamily: "'Mansalva', cursive" }}
          >
            {gameName}
          </h1>
          <div
            className="flex items-center gap-1.5 text-[11px] flex-shrink-0 tabular-nums font-semibold"
            style={(isV3Theme && !isV3Mansalva)
              ? { color: "var(--game-text-muted)", fontFamily: "var(--n-shell-ui), 'Manrope', sans-serif" }
              : { color: "var(--game-text-muted)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <span>#{puzzleNumber}</span>
            <span style={{ opacity: 0.35 }}>·</span>
            <span>{languageLabel}</span>
            <span style={{ opacity: 0.35 }}>·</span>
            <span>{formatTime(elapsed)}</span>
          </div>
        </div>
      </header>

      {/* Game Content — constrained on desktop, safe-area aware */}
      <main
        className={cn("game-content px-4 pt-3 mx-auto", contentWidthClass)}
        style={{
          paddingBottom: inTg
            ? "max(5rem, calc(2rem + env(safe-area-inset-bottom, 0px)))"
            : "max(6rem, calc(2rem + env(safe-area-inset-bottom, 0px)))",
        }}
      >
        {children}
      </main>
    </div>
  );
}

export { formatTime };
