/**
 * GameShell — Universal wrapper for all games.
 * Telegram-aware with theme colours, timer, streak display.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStreakStore } from '@/stores/streak';
import { formatTime } from '@/lib/share';
import { tg } from '@/telegram';

interface GameShellProps {
  gameName: string;
  puzzleNumber: number;
  language: string;
  onBack?: () => void;
  children: React.ReactNode;
}

export function GameShell({
  gameName,
  puzzleNumber,
  language,
  onBack,
  children,
}: GameShellProps) {
  const [elapsed, setElapsed] = useState(0);
  const streak = useStreakStore();
  const startTimeRef = useState(() => Date.now())[0];

  // Timer — count up
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTimeRef);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTimeRef]);

  // Set up back button if callback provided
  useEffect(() => {
    if (onBack) {
      tg.showBackButton(onBack);
      return () => tg.hideBackButton();
    }
  }, [onBack]);

  const languageLabel = getLanguageLabel(language);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 px-4 py-3">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">{gameName}</h1>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>#{puzzleNumber}</span>
                <span>·</span>
                <span>{languageLabel}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Timer */}
              <div className="flex items-center gap-1 text-sm font-mono text-muted">
                <span>⏱</span>
                <span>{formatTime(elapsed)}</span>
              </div>
              
              {/* Streak badge */}
              {streak.current > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-xs font-bold"
                >
                  <span>{streak.tier.emoji}</span>
                  <span>{streak.current}</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Game content */}
      <main className="px-4 py-6">
        <div className="mx-auto max-w-lg">
          {children}
        </div>
      </main>
    </div>
  );
}

function getLanguageLabel(code: string): string {
  const labels: Record<string, string> = {
    es: '🇪🇸 Español',
    fr: '🇫🇷 Français',
    de: '🇩🇪 Deutsch',
    it: '🇮🇹 Italiano',
    pt: '🇧🇷 Português',
  };
  return labels[code] || code;
}
