"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStreakData, getStreakTier } from "@/lib/games/streaks";
import { getLanguageLabel, isRtl } from "@/lib/games/language-utils";
import { haptic } from "@/lib/games/haptics";
import { recordDailyProgress } from "@/lib/games/progress";
import {
  isTelegram,
  tgBackButton,
  tgMainButton,
  tgSecondaryButton,
  enableClosingConfirmation,
  disableClosingConfirmation,
  setBottomBarColor,
  tgThemeParams,
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
  onShare?: () => void;
  onExplainMistakes?: () => void;
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
  onShare,
  onExplainMistakes,
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

  // Telegram MainButton for "Share Result" + SecondaryButton for "Explain Mistakes"
  React.useEffect(() => {
    if (!inTg || !isComplete) return;

    // Set bottom bar colour when buttons are visible
    const theme = tgThemeParams();
    if (theme) {
      const barColor = theme.bottom_bar_bg_color || theme.secondary_bg_color || theme.bg_color || "#1c1c1d";
      setBottomBarColor(barColor);
    }

    // Main button: Share Result
    if (onShare) {
      tgMainButton.show("📋 Share Result", onShare);
    }

    // Secondary button: Explain Mistakes
    if (mistakes > 0 && onExplainMistakes && tgSecondaryButton.isAvailable()) {
      tgSecondaryButton.show("🧠 Explain Mistakes", onExplainMistakes);
    }

    return () => {
      if (onShare) {
        tgMainButton.offClick(onShare);
        tgMainButton.hide();
      }
      if (onExplainMistakes) {
        tgSecondaryButton.offClick(onExplainMistakes);
        tgSecondaryButton.hide();
      }
    };
  }, [inTg, isComplete, onShare, onExplainMistakes, mistakes]);

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
            borderBottom: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <div className="flex items-center justify-between">
            <Link
              href="/games"
              className="flex items-center gap-1.5 touch-manipulation"
            >
              <svg
                className="h-4 w-4"
                style={{ color: "var(--game-text-muted)" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span
                className="text-sm font-medium"
                style={{ color: "var(--game-text-secondary)" }}
              >
                Games
              </span>
            </Link>
            <div className="flex items-center gap-2">
              {streak.current > 0 && (
                <Badge
                  variant="outline"
                  className="gap-1 text-xs border-[rgba(0,0,0,0.1)]"
                  style={{ color: "var(--game-text-secondary)" }}
                >
                  {streakTier.emoji} {streak.current}
                </Badge>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Compact Game Header — single line, Design Bible style */}
      <header className={cn(
        "game-header px-4 pb-2",
        inTg ? "pt-2" : "pt-3",
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <h1
              className="font-bold truncate text-base"
              style={{ color: "var(--game-text-primary)" }}
            >
              {gameName}
            </h1>
          </div>
          <div
            className="flex items-center gap-2 text-xs flex-shrink-0"
            style={{ color: "var(--game-text-secondary)" }}
          >
            <span>#{puzzleNumber}</span>
            <span style={{ opacity: 0.3 }}>·</span>
            <span>{languageLabel}</span>
            <span style={{ opacity: 0.3 }}>·</span>
            <span
              className={cn(
                "font-mono tabular-nums",
                !isComplete && "game-text-glow",
              )}
              style={{
                color: !isComplete ? "var(--game-text-accent)" : "var(--game-text-secondary)",
              }}
            >
              {formatTime(elapsed)}
            </span>
          </div>
        </div>
      </header>

      {/* Game Content — full width */}
      <main className={cn("game-content px-5 pt-4", inTg ? "pb-20" : "pb-24")}>
        {children}
      </main>

      {/* End-of-game CTAs — skip in Telegram if MainButton is handling share */}
      <AnimatePresence>
        {isComplete && !inTg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="fixed inset-x-0 bottom-0 z-50 px-4 py-4"
            style={{
              background: "rgba(255, 255, 255, 0.92)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              borderTop: "1px solid rgba(0,0,0,0.08)",
              paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
            }}
          >
            <div className="flex flex-col gap-2.5">
              {onShare && (
                <Button
                  onClick={onShare}
                  variant="default"
                  size="lg"
                  className="w-full rounded-xl min-h-[48px]"
                >
                  📋 Share Result
                </Button>
              )}
              {mistakes > 0 && onExplainMistakes && (
                <Button
                  onClick={onExplainMistakes}
                  variant="outline"
                  size="lg"
                  className="w-full rounded-xl min-h-[48px] border-[rgba(0,0,0,0.1)] text-[var(--game-text-secondary)]"
                >
                  🧠 Explain My Mistakes
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* In Telegram, show Explain Mistakes as inline button only if SecondaryButton isn't available */}
      <AnimatePresence>
        {isComplete && inTg && mistakes > 0 && onExplainMistakes && !tgSecondaryButton.isAvailable() && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="fixed inset-x-0 bottom-0 z-50 px-4 py-3"
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
            }}
          >
            <Button
              onClick={onExplainMistakes}
              variant="outline"
              size="lg"
              className="w-full rounded-xl min-h-[48px] border-[rgba(0,0,0,0.1)] text-[var(--game-text-secondary)]"
            >
              🧠 Explain My Mistakes
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { formatTime };
