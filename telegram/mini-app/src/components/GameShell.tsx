/**
 * GameShell — Universal wrapper for all games.
 * Solid #2C2C40 header, safe-area-aware, monospace timer.
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

  // Enable closing confirmation while in a game
  useEffect(() => {
    tg.enableClosingConfirmation();
    return () => tg.disableClosingConfirmation();
  }, []);

  const languageLabel = getLanguageLabel(language);

  return (
    <div className="min-h-[100dvh] bg-[#1A1A2E]">
      {/* Header — solid surface bar, below safe area */}
      <header className="sticky top-0 z-20 pt-[env(safe-area-inset-top,0px)]">
        <div className="bg-[#2C2C40] border-b border-[rgba(255,255,255,0.08)] px-5 py-3">
          <div className="mx-auto max-w-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[18px] font-bold text-[#E0E0E0]">{gameName}</h1>
                <div className="flex items-center gap-1.5 text-[13px] text-[#A0A0A0]">
                  <span>#{puzzleNumber}</span>
                  <span>·</span>
                  <span>{languageLabel}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Timer */}
                <div className="flex items-center gap-1.5 font-mono text-[16px] font-bold text-[#8B5CF6]">
                  <Clock size={18} strokeWidth={2} />
                  <span>{formatTime(elapsed)}</span>
                </div>
                
                {/* Streak badge */}
                {streakCurrent > 0 && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="flex items-center gap-1 rounded-full bg-[#1A1A2E] border border-[rgba(255,255,255,0.08)] px-2.5 py-1 text-xs font-bold text-[#E0E0E0]"
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
