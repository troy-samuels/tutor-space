"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStreakData, getStreakTier } from "@/lib/games/streaks";
import { cn } from "@/lib/utils";

interface GameShellProps {
  gameName: string;
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
  puzzleNumber,
  language,
  isComplete,
  isWon,
  mistakes,
  onShare,
  onExplainMistakes,
  children,
}: GameShellProps) {
  const [elapsed, setElapsed] = React.useState(0);
  const [streak, setStreak] = React.useState({ current: 0, longest: 0 });
  const [streakTier, setStreakTier] = React.useState({ name: "New", emoji: "🌱" });
  const startTimeRef = React.useRef(Date.now());

  // Read streak from localStorage on mount
  React.useEffect(() => {
    const data = getStreakData();
    setStreak({ current: data.current, longest: data.longest });
    setStreakTier(getStreakTier(data.current));
  }, []);

  // Timer — count up until game complete
  React.useEffect(() => {
    if (isComplete) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 1000);
    return () => clearInterval(interval);
  }, [isComplete]);

  const languageLabel =
    language === "es"
      ? "🇪🇸 Español"
      : language === "fr"
        ? "🇫🇷 Français"
        : language === "de"
          ? "🇩🇪 Deutsch"
          : language === "it"
            ? "🇮🇹 Italiano"
            : language === "pt"
              ? "🇧🇷 Português"
              : language;

  return (
    <div className="dark min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link href="/games" className="flex items-center gap-2">
            <Logo variant="icon" className="h-6 w-6" />
            <span className="text-sm font-medium text-muted-foreground">Games</span>
          </Link>
          <div className="flex items-center gap-2">
            {streak.current > 0 && (
              <Badge variant="outline" className="gap-1 text-xs">
                {streakTier.emoji} {streak.current}
              </Badge>
            )}
          </div>
        </div>
      </nav>

      {/* Game Header */}
      <header className="px-4 pt-5 pb-3">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="font-heading text-2xl text-foreground">{gameName}</h1>
          <div className="mt-1.5 flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <span>#{puzzleNumber}</span>
            <span className="opacity-40">·</span>
            <span>{languageLabel}</span>
            <span className="opacity-40">·</span>
            <span className="font-mono tabular-nums">{formatTime(elapsed)}</span>
          </div>
        </div>
      </header>

      {/* Game Content */}
      <main className="px-4 pb-8">
        <div className="mx-auto max-w-lg">
          {children}
        </div>
      </main>

      {/* End-of-game CTAs */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="fixed inset-x-0 bottom-0 z-50 border-t border-border/50 bg-background/80 px-4 py-4 backdrop-blur-md"
          >
            <div className="mx-auto flex max-w-lg flex-col gap-2.5">
              {onShare && (
                <Button
                  onClick={onShare}
                  variant="default"
                  size="lg"
                  className="w-full rounded-xl"
                >
                  📋 Share Result
                </Button>
              )}
              {mistakes > 0 && onExplainMistakes && (
                <Button
                  onClick={onExplainMistakes}
                  variant="outline"
                  size="lg"
                  className="w-full rounded-xl"
                >
                  🧠 Explain My Mistakes
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { formatTime };
