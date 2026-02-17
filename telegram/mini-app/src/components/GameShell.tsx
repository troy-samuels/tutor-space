/**
 * GameShell — Universal wrapper for all games.
 * Telegram-aware with theme colours, timer, streak display.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStreakStore } from '@/stores/streak';
import { formatTime } from '@/lib/share';
import { tg } from '@/telegram';
import { Clock } from 'lucide-react';

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
  const { current: streakCurrent, tier: streakTier } = useStreakStore();
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
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">{gameName}</h1>
              <div className="flex items-center gap-2 text-sm text-muted">
                <span>#{puzzleNumber}</span>
                <span>·</span>
                <span>{languageLabel}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Timer */}
              <div className="flex items-center gap-1 font-mono text-lg font-bold text-primary">
                <Clock size={20} strokeWidth={2} />
                <span>{formatTime(elapsed)}</span>
              </div>
              
              {/* Streak badge */}
              {streakCurrent > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-xs font-bold shadow-md"
                >
                  <span>{streakTier.emoji}</span>
                  <span>{streakCurrent}</span>
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
