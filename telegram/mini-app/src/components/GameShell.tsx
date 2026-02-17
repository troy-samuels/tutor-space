/**
 * GameShell — Universal wrapper for all games.
 * Dark glass header, safe-area-aware, with timer + streak.
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
    <div className="min-h-[100dvh] bg-[#0a0a0b]">
      {/* Header — glass bar, below safe area */}
      <header className="sticky top-0 z-20 pt-[env(safe-area-inset-top,0px)]">
        <div className="bg-white/[0.04] backdrop-blur-xl border-b border-white/10 px-5 py-3">
          <div className="mx-auto max-w-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[18px] font-bold text-white">{gameName}</h1>
                <div className="flex items-center gap-1.5 text-[13px] text-white/50">
                  <span>#{puzzleNumber}</span>
                  <span>·</span>
                  <span>{languageLabel}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Timer */}
                <div className="flex items-center gap-1.5 font-mono text-[16px] font-bold text-primary">
                  <Clock size={18} strokeWidth={2} />
                  <span>{formatTime(elapsed)}</span>
                </div>
                
                {/* Streak badge */}
                {streakCurrent > 0 && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="flex items-center gap-1 rounded-full bg-white/[0.08] border border-white/10 px-2.5 py-1 text-xs font-bold text-white"
                  >
                    <span>{streakTier.emoji}</span>
                    <span>{streakCurrent}</span>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Game content */}
      <main className="px-4 py-5">
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
